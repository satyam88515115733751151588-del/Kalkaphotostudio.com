/* ============================================================
   cloudinary.js — unsigned upload to Cloudinary
   Requires an unsigned upload preset configured in the
   Cloudinary dashboard (Settings → Upload → Upload presets).
   ============================================================ */

const CloudinaryUpload = (() => {

  /**
   * Upload a single file to Cloudinary using an unsigned preset.
   * @param {File} file
   * @param {{cloudName:string, uploadPreset:string}} settings
   * @param {(percent:number)=>void} onProgress
   * @returns {Promise<{url:string, publicId:string, width:number, height:number}>}
   */
  function uploadFile(file, settings, onProgress) {
    return new Promise((resolve, reject) => {
      if (!settings.cloudName || !settings.uploadPreset) {
        reject(new Error('Add your Cloudinary cloud name and unsigned upload preset in Settings first.'));
        return;
      }

      const url = `https://api.cloudinary.com/v1_1/${settings.cloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', settings.uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              url: data.secure_url,
              publicId: data.public_id,
              width: data.width,
              height: data.height
            });
          } else {
            reject(new Error(data.error?.message || 'Upload failed'));
          }
        } catch (err) {
          reject(err);
        }
      };

      xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'));
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files sequentially, reporting overall progress.
   */
  async function uploadFiles(files, settings, onFileProgress, onOverallProgress) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const result = await uploadFile(files[i], settings, (pct) => {
        if (onFileProgress) onFileProgress(i, pct);
        if (onOverallProgress) {
          const overall = Math.round(((i + pct / 100) / files.length) * 100);
          onOverallProgress(overall);
        }
      });
      results.push(result);
    }
    return results;
  }

  return { uploadFile, uploadFiles };
})();
