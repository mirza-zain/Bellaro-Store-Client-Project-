import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dddsn39gd";
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || "bazaario";
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary SDK if credentials exist
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export type UploadResult = {
  success: boolean;
  url?: string;
  publicId?: string;
  deleteToken?: string;
  error?: string;
};

export async function isCloudinaryConfigured(): Promise<boolean> {
  return Boolean(cloudName && (uploadPreset || (apiKey && apiSecret)));
}

/**
 * Uploads an image (base64 string, buffer, or remote URL) to Cloudinary.
 * Uses the unsigned upload preset ("bazaario") by default — NO API KEY/SECRET NEEDED!
 * Falls back to signed SDK upload if API Key and Secret are configured.
 */
export async function uploadToCloudinary(
  fileOrBase64: string,
  folder: string = "bazzario"
): Promise<UploadResult> {
  if (!cloudName) {
    console.warn("[Cloudinary] Cloud name not found. Returning input fallback.");
    return { success: true, url: fileOrBase64 };
  }

  // 1. Direct REST Upload using Unsigned Upload Preset ("bazaario")
  // No API Key or API Secret required!
  try {
    const formData = new FormData();
    formData.append("file", fileOrBase64);
    formData.append("upload_preset", uploadPreset);
    if (folder) {
      formData.append("folder", folder);
    }

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok && (data.secure_url || data.url)) {
      return {
        success: true,
        url: data.secure_url || data.url,
        publicId: data.public_id,
        deleteToken: data.delete_token,
      };
    } else {
      console.warn("[Cloudinary] Preset upload response message:", data?.error?.message || data);

      // If preset upload had an issue and API Key/Secret are provided, try signed upload
      if (apiKey && apiSecret) {
        const uploadResponse = await cloudinary.uploader.upload(fileOrBase64, {
          folder,
          resource_type: "auto",
        });
        return {
          success: true,
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
        };
      }

      return {
        success: false,
        error: data?.error?.message || "Failed to upload image with preset",
      };
    }
  } catch (error: any) {
    console.error("[Cloudinary] Unsigned upload error:", error);

    // Fallback to SDK signed upload if credentials exist
    if (apiKey && apiSecret) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(fileOrBase64, {
          folder,
          resource_type: "auto",
        });
        return {
          success: true,
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
        };
      } catch (sdkError: any) {
        return { success: false, error: sdkError?.message || "Cloudinary upload failed" };
      }
    }

    return {
      success: false,
      error: error?.message || "Cloudinary upload failed",
    };
  }
}

/**
 * Removes an image from Cloudinary using delete token (if available from unsigned upload)
 * or cloudinary.uploader.destroy (if API secret is configured).
 */
export async function deleteFromCloudinary(
  publicIdOrToken: string,
  isDeleteToken: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isDeleteToken) {
      const formData = new FormData();
      formData.append("token", publicIdOrToken);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return { success: data.result === "ok" };
    }

    if (apiKey && apiSecret) {
      const res = await cloudinary.uploader.destroy(publicIdOrToken);
      return { success: res.result === "ok" };
    }

    console.info("[Cloudinary] Image reference removed. (Server-side public_id deletion requires API Secret).");
    return { success: true };
  } catch (err: any) {
    console.error("[Cloudinary] Error removing image:", err);
    return { success: false, error: err?.message };
  }
}

/**
 * Server Action for client-side file uploads directly to Cloudinary.
 */
export async function uploadFileAction(formData: FormData): Promise<UploadResult> {
  try {
    const { verifyAdminSession } = await import("@/app/lib/actions/admin");
    await verifyAdminSession();

    const file = (formData.get("file") || formData.get("imageFile")) as File | null;
    const folder = (formData.get("folder") as string) || "bazzario";

    if (!file || typeof file === "string") {
      const base64Str = formData.get("base64") as string | null;
      if (base64Str) {
        return await uploadToCloudinary(base64Str, folder);
      }
      return { success: false, error: "No image file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return await uploadToCloudinary(dataUri, folder);
  } catch (error: any) {
    console.error("[Cloudinary] Server Action upload error:", error);
    return {
      success: false,
      error: error?.message || "Failed to process image upload",
    };
  }
}
