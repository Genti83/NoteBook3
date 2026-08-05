import fs from 'fs';
import path from 'path';

const targetPath = path.join('node_modules', 'capacitor-save-as', 'android', 'src', 'main', 'java', 'com', 'adsurkasur', 'saveas', 'SaveAs.java');

const correctCode = `package com.adsurkasur.saveas;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginMethod;
import java.io.OutputStream;
import androidx.documentfile.provider.DocumentFile;

@CapacitorPlugin(name = "SaveAs")
public class SaveAs extends Plugin {

    @PluginMethod
    public void showSaveAsPicker(PluginCall call) {
        String filename = call.getString("filename", "export.json");
        String mimeType = call.getString("mimeType", "application/json");
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        startActivityForResult(call, intent, "saveAsCallback");
    }

    @ActivityCallback
    private void saveAsCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri uri = result.getData().getData();
            String data = call.getString("data");
            if (data == null) {
                call.reject("Data is null");
                return;
            }
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                byte[] bytes = Base64.decode(data, Base64.DEFAULT);
                out.write(bytes);
                JSObject ret = new JSObject();
                ret.put("uri", uri.toString());
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Failed to write file: " + e.getMessage());
            }
        } else {
            call.reject("User cancelled");
        }
    }

    @PluginMethod
    public void selectDirectory(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "selectDirectoryCallback");
    }

    @ActivityCallback
    private void selectDirectoryCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Uri treeUri = result.getData().getData();
            if (treeUri == null) {
                call.reject("Tree Uri is null");
                return;
            }

            // Persist permission
            int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
            try {
                getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);
            } catch (Exception e) {
                System.out.println("takePersistableUriPermission failed: " + e.getMessage());
            }

            // Store natively
            SharedPreferences prefs = getContext().getSharedPreferences("SaveAsPrefs", Context.MODE_PRIVATE);
            prefs.edit().putString("selected_directory_uri", treeUri.toString()).apply();

            JSObject ret = new JSObject();
            ret.put("uri", treeUri.toString());
            call.resolve(ret);
        } else {
            call.reject("User cancelled");
        }
    }

    @PluginMethod
    public void saveFileToDirectory(PluginCall call) {
        String directoryUriStr = call.getString("directoryUri");
        if (directoryUriStr == null || directoryUriStr.isEmpty()) {
            SharedPreferences prefs = getContext().getSharedPreferences("SaveAsPrefs", Context.MODE_PRIVATE);
            directoryUriStr = prefs.getString("selected_directory_uri", null);
        }

        if (directoryUriStr == null || directoryUriStr.isEmpty()) {
            call.reject("No directory selected");
            return;
        }

        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType", "application/json");
        String data = call.getString("data");

        if (filename == null || data == null) {
            call.reject("Filename and data are required");
            return;
        }

        try {
            Uri treeUri = Uri.parse(directoryUriStr);
            DocumentFile pickedDir = DocumentFile.fromTreeUri(getContext(), treeUri);
            if (pickedDir == null || !pickedDir.canWrite()) {
                call.reject("Cannot write to directory. Please pick a different directory.");
                return;
            }

            DocumentFile existingFile = pickedDir.findFile(filename);
            if (existingFile != null) {
                existingFile.delete();
            }

            DocumentFile file = pickedDir.createFile(mimeType, filename);
            if (file == null) {
                call.reject("Failed to create file: " + filename);
                return;
            }

            try (OutputStream out = getContext().getContentResolver().openOutputStream(file.getUri())) {
                byte[] bytes = Base64.decode(data, Base64.DEFAULT);
                out.write(bytes);
                JSObject ret = new JSObject();
                ret.put("uri", file.getUri().toString());
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Failed to write file to directory: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getSelectedDirectory(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("SaveAsPrefs", Context.MODE_PRIVATE);
        String uri = prefs.getString("selected_directory_uri", null);
        JSObject ret = new JSObject();
        ret.put("uri", uri);
        call.resolve(ret);
    }

    @PluginMethod
    public void clearSelectedDirectory(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("SaveAsPrefs", Context.MODE_PRIVATE);
        prefs.edit().remove("selected_directory_uri").apply();
        call.resolve();
    }
}
`;

try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, correctCode, 'utf8');
    console.log('Successfully patched SaveAs.java with native directory methods!');
} catch (err) {
    console.error('Error patching SaveAs.java:', err);
}

// Now patch build.gradle to compile SDK 36, target SDK 36 and add documentfile dependency
const gradlePath = path.join('node_modules', 'capacitor-save-as', 'android', 'build.gradle');
try {
    if (fs.existsSync(gradlePath)) {
        let content = fs.readFileSync(gradlePath, 'utf8');
        // Replace compileSdkVersion 35 with compileSdkVersion 36
        content = content.replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 36');
        // Replace targetSdkVersion 35 with targetSdkVersion 36
        content = content.replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 36');
        
        // Add androidx.documentfile dependency if not present
        if (!content.includes('androidx.documentfile:documentfile')) {
            content = content.replace(
                'implementation "androidx.appcompat:appcompat:1.7.0"',
                'implementation "androidx.appcompat:appcompat:1.7.0"\n    implementation "androidx.documentfile:documentfile:1.0.1"'
            );
        }
        
        fs.writeFileSync(gradlePath, content, 'utf8');
        console.log('Successfully patched build.gradle to SDK 36 and added documentfile dependency!');
    }
} catch (err) {
    console.error('Error patching build.gradle:', err);
}
