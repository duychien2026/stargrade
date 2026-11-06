package com.stargrade.appinventor;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.common.ComponentCategory;
import com.google.appinventor.components.runtime.*;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@DesignerComponent(
    version = 1,
    description = "Extension StarGrade - Chấm phiếu trắc nghiệm thông minh bằng Camera và ảnh tĩnh cho MIT App Inventor.",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "aiwebres/icon.png"
)
@SimpleObject(external = true)
@UsesPermissions(permissionNames = "android.permission.INTERNET, android.permission.CAMERA, android.permission.READ_EXTERNAL_STORAGE")
public class StarGrade extends AndroidNonvisibleComponent implements Component {

    private final Activity activity;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private String serverUrl = "https://starmind-exam.onrender.com";
    private String template = "bgd2";
    private int examId = 1;
    private String sessionCookie = "";

    public StarGrade(ComponentContainer container) {
        super(container);
        this.activity = container.$context();
    }

    // --- Properties ---

    @SimpleProperty(description = "Đường dẫn máy chủ StarGrade (VD: https://starmind-exam.onrender.com hoặc server riêng).")
    public String ServerUrl() {
        return serverUrl;
    }

    @SimpleProperty
    public void ServerUrl(String url) {
        if (url != null && !url.trim().isEmpty()) {
            String u = url.trim();
            if (!u.startsWith("http://") && !u.startsWith("https://")) {
                u = "https://" + u;
            }
            if (u.endsWith("/")) {
                u = u.substring(0, u.length() - 1);
            }
            this.serverUrl = u;
        }
    }

    @SimpleProperty(description = "Mẫu phiếu thi (bgd2, bgd2025original, bgd2025pink, qm40, qmcv4, phutho, tnmaker40).")
    public String Template() {
        return template;
    }

    @SimpleProperty
    public void Template(String tpl) {
        if (tpl != null && !tpl.trim().isEmpty()) {
            this.template = tpl.trim();
        }
    }

    @SimpleProperty(description = "ID của bài kiểm tra trên máy chủ.")
    public int ExamId() {
        return examId;
    }

    @SimpleProperty
    public void ExamId(int id) {
        this.examId = id;
    }

    // --- Methods ---

    @SimpleFunction(description = "Chấm bài trắc nghiệm từ đường dẫn file ảnh trên điện thoại (ảnh chụp hoặc thư viện).")
    public void GradeImage(final String imagePath) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    File file = new File(imagePath);
                    if (!file.exists()) {
                        postError("File ảnh không tồn tại: " + imagePath);
                        return;
                    }
                    Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
                    if (bitmap == null) {
                        postError("Không thể giải mã file ảnh.");
                        return;
                    }

                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    bitmap.compress(Bitmap.CompressFormat.JPEG, 90, baos);
                    byte[] imageBytes = baos.toByteArray();
                    String base64Image = "data:image/jpeg;base64," + Base64.encodeToString(imageBytes, Base64.NO_WRAP);

                    performGrade(base64Image);
                } catch (Exception e) {
                    postError("Lỗi đọc ảnh: " + e.getMessage());
                }
            }
        });
    }

    @SimpleFunction(description = "Chấm bài trắc nghiệm từ chuỗi Base64 của ảnh.")
    public void GradeBase64(final String base64Image) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                performGrade(base64Image);
            }
        });
    }

    private void performGrade(String base64Data) {
        try {
            JSONObject body = new JSONObject();
            body.put("image_data", base64Data);
            body.put("template", template);

            String response = postHttp(serverUrl + "/api/omr", body.toString());
            JSONObject resJson = new JSONObject(response);

            if (resJson.has("error")) {
                postGradingResult("", "", 0f, "", "", "", false, resJson.getString("error"));
                return;
            }

            final String sbd = resJson.optString("student_no", "");
            final String code = resJson.optString("code", "");
            final String p1 = resJson.optString("part1", "");
            
            JSONArray p2Arr = resJson.optJSONArray("part2");
            final String p2 = p2Arr != null ? p2Arr.toString() : "";

            JSONArray p3Arr = resJson.optJSONArray("part3Text");
            final String p3 = p3Arr != null ? p3Arr.toString() : "";

            final float score = (float) resJson.optDouble("score", 0.0);

            postGradingResult(sbd, code, score, p1, p2, p3, true, "");
        } catch (Exception e) {
            postGradingResult("", "", 0f, "", "", "", false, e.getMessage());
        }
    }

    @SimpleFunction(description = "Đăng nhập tài khoản StarGrade để đồng bộ điểm lên máy chủ.")
    public void Login(final String username, final String password) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    JSONObject body = new JSONObject();
                    body.put("username", username);
                    body.put("password", password);

                    HttpResult res = requestHttp(serverUrl + "/api/auth/login", "POST", body.toString(), true);
                    JSONObject json = new JSONObject(res.body);

                    if (res.code == 200 && json.has("user")) {
                        final String userName = json.getJSONObject("user").optString("name", username);
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                AfterLogin(true, "Đăng nhập thành công", userName);
                            }
                        });
                    } else {
                        final String errMsg = json.optString("error", "Đăng nhập thất bại");
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                AfterLogin(false, errMsg, "");
                            }
                        });
                    }
                } catch (Exception e) {
                    final String err = e.getMessage();
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            AfterLogin(false, err, "");
                        }
                    });
                }
            }
        });
    }

    @SimpleFunction(description = "Lưu kết quả bài thi học sinh lên máy chủ StarGrade.")
    public void SaveSubmission(final int eid, final String studentNo, final String studentName, final String code, final String answers, final String part2, final String part3) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    JSONObject body = new JSONObject();
                    body.put("student_no", studentNo);
                    body.put("student_name", studentName);
                    body.put("code", code);
                    body.put("answers", answers);

                    if (part2 != null && !part2.trim().isEmpty()) {
                        body.put("part2", new JSONArray(part2));
                    }
                    if (part3 != null && !part3.trim().isEmpty()) {
                        body.put("part3", new JSONArray(part3));
                    }

                    HttpResult res = requestHttp(serverUrl + "/api/exams/" + eid + "/submissions", "POST", body.toString(), true);
                    JSONObject json = new JSONObject(res.body);

                    if (res.code == 200 || res.code == 201) {
                        final int subId = json.optInt("id", 0);
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                AfterSaveSubmission(true, subId, "Đã lưu kết quả thành công");
                            }
                        });
                    } else {
                        final String err = json.optString("error", "Lỗi lưu kết quả");
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                AfterSaveSubmission(false, 0, err);
                            }
                        });
                    }
                } catch (Exception e) {
                    final String err = e.getMessage();
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            AfterSaveSubmission(false, 0, err);
                        }
                    });
                }
            }
        });
    }

    @SimpleFunction(description = "Lấy danh sách các mẫu phiếu thi được hỗ trợ.")
    public String GetSupportedTemplates() {
        return "bgd2 (BGD-2025 Chuẩn), bgd2025original (BGD Đen Trắng), bgd2025pink (BGD Hồng), qm40 (QM-40 Ngang), qmcv4 (QM CV4 Ngang), phutho (HSG Phú Thọ), tnmaker40 (TNMaker-40)";
    }

    // --- Events ---

    @SimpleEvent(description = "Kích hoạt sau khi chấm xong bài thi OMR.")
    public void AfterGrading(String studentNo, String code, float score, String part1, String part2, String part3, boolean success, String errorMessage) {
        EventDispatcher.dispatchEvent(this, "AfterGrading", studentNo, code, score, part1, part2, part3, success, errorMessage);
    }

    @SimpleEvent(description = "Kích hoạt sau khi đăng nhập máy chủ.")
    public void AfterLogin(boolean success, String message, String userName) {
        EventDispatcher.dispatchEvent(this, "AfterLogin", success, message, userName);
    }

    @SimpleEvent(description = "Kích hoạt sau khi lưu điểm bài thi lên máy chủ.")
    public void AfterSaveSubmission(boolean success, int submissionId, String message) {
        EventDispatcher.dispatchEvent(this, "AfterSaveSubmission", success, submissionId, message);
    }

    @SimpleEvent(description = "Kích hoạt khi gặp lỗi xử lý.")
    public void OnError(String errorMessage) {
        EventDispatcher.dispatchEvent(this, "OnError", errorMessage);
    }

    // --- Helpers ---

    private void postGradingResult(final String sbd, final String code, final float score, final String p1, final String p2, final String p3, final boolean ok, final String err) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                AfterGrading(sbd, code, score, p1, p2, p3, ok, err);
            }
        });
    }

    private void postError(final String msg) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                OnError(msg);
            }
        });
    }

    private static class HttpResult {
        int code;
        String body;
    }

    private String postHttp(String urlStr, String jsonBody) throws Exception {
        return requestHttp(urlStr, "POST", jsonBody, false).body;
    }

    private HttpResult requestHttp(String urlStr, String method, String jsonBody, boolean trackCookie) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");

        if (!sessionCookie.isEmpty()) {
            conn.setRequestProperty("Cookie", sessionCookie);
        }

        if (jsonBody != null && (method.equals("POST") || method.equals("PUT"))) {
            conn.setDoOutput(true);
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
        }

        HttpResult result = new HttpResult();
        result.code = conn.getResponseCode();

        if (trackCookie) {
            String headerName;
            for (int i = 1; (headerName = conn.getHeaderFieldKey(i)) != null; i++) {
                if (headerName.equalsIgnoreCase("Set-Cookie")) {
                    String cookie = conn.getHeaderField(i);
                    sessionCookie = cookie.split(";")[0];
                }
            }
        }

        InputStream is = result.code >= 200 && result.code < 400 ? conn.getInputStream() : conn.getErrorStream();
        if (is != null) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();
            result.body = sb.toString();
        } else {
            result.body = "{}";
        }
        return result;
    }
}
