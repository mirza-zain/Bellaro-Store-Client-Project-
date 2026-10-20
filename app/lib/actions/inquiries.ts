'use server';

import { db } from "@/app/lib/db";
import { inquiries } from "@/app/db/schema";
import { ensureTablesExist } from "@/app/lib/actions/admin";

export type SubmitInquiryInput = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type SubmitInquiryResult = {
  success: boolean;
  error?: string;
};

export async function submitInquiryAction(
  input: SubmitInquiryInput
): Promise<SubmitInquiryResult> {
  try {
    await ensureTablesExist();

    const name = input.name.trim();
    const email = input.email.trim();
    const message = input.message.trim();
    const subject = input.subject?.trim() || "Customer General Inquiry";

    if (!name || !email || !message) {
      return {
        success: false,
        error: "Please complete all required fields (name, email, and message).",
      };
    }

    if (!email.includes("@") || !email.includes(".")) {
      return {
        success: false,
        error: "Please enter a valid email address.",
      };
    }

    await db.insert(inquiries).values({
      name,
      email,
      subject,
      message,
      status: "Unread",
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error submitting inquiry:", error);
    return {
      success: false,
      error: "An error occurred while submitting your inquiry. Please try again or reach out on WhatsApp.",
    };
  }
}

