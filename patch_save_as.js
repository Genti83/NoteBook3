import fs from 'fs';
import path from 'path';

const targetPath = path.join('node_modules', 'capacitor-save-as', 'android', 'src', 'main', 'java', 'com', 'adsurkasur', 'saveas', 'SaveAs.java');

const correctCode = `package com.adsurkasur.saveas;

import android.app.Activity;
import android.content.Intent;
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
}
`;

try {
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, correctCode, 'utf8');
    console.log('Successfully patched SaveAs.java!');
} catch (err) {
    console.error('Error patching SaveAs.java:', err);
}

// Now patch build.gradle to compile SDK 36 and target SDK 36
const gradlePath = path.join('node_modules', 'capacitor-save-as', 'android', 'build.gradle');
try {
    if (fs.existsSync(gradlePath)) {
        let content = fs.readFileSync(gradlePath, 'utf8');
        // Replace compileSdkVersion 35 with compileSdkVersion 36
        content = content.replace(/compileSdkVersion\s+\d+/g, 'compileSdkVersion 36');
        // Replace targetSdkVersion 35 with targetSdkVersion 36
        content = content.replace(/targetSdkVersion\s+\d+/g, 'targetSdkVersion 36');
        fs.writeFileSync(gradlePath, content, 'utf8');
        console.log('Successfully patched build.gradle to SDK 36!');
    }
} catch (err) {
    console.error('Error patching build.gradle:', err);
}
