import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email utility
const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Myntra Clone" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Send verification email
export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ef4444; margin-bottom: 10px;">Myntra Clone</h1>
        <p style="color: #6b7280; font-size: 16px;">Welcome! Please verify your email address</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #374151; margin-bottom: 15px;">Verify Your Email</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
          Thank you for registering with Myntra Clone! To complete your registration and start shopping,
          please click the button below to verify your email address.
        </p>

        <div style="text-align: center;">
          <a href="${verificationUrl}"
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Verify Email
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px; text-align: center;">
          Or copy and paste this link in your browser:<br>
          <span style="color: #374151; word-break: break-all;">${verificationUrl}</span>
        </p>
      </div>

      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          <strong>Important:</strong> This verification link will expire in 24 hours.
          If you didn't create an account, please ignore this email.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          © 2024 Myntra Clone. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Myntra Clone',
    html,
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ef4444; margin-bottom: 10px;">Myntra Clone</h1>
        <p style="color: #6b7280; font-size: 16px;">Password Reset Request</p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #374151; margin-bottom: 15px;">Reset Your Password</h2>
        <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
          We received a request to reset your password for your Myntra Clone account.
          Click the button below to set a new password.
        </p>

        <div style="text-align: center;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 20px; text-align: center;">
          Or copy and paste this link in your browser:<br>
          <span style="color: #374151; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>

      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          <strong>Important:</strong> This password reset link will expire in 10 minutes.
          If you didn't request a password reset, please ignore this email.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          © 2024 Myntra Clone. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Myntra Clone',
    html,
  });
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (email: string, orderData: any): Promise<void> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ef4444; margin-bottom: 10px;">Myntra Clone</h1>
        <p style="color: #6b7280; font-size: 16px;">Order Confirmation</p>
      </div>

      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #22c55e;">
        <p style="color: #166534; margin: 0; font-size: 16px;">
          <strong>Thank you for your order!</strong> Your order has been successfully placed.
        </p>
        <p style="color: #166534; margin: 10px 0 0 0; font-size: 14px;">
          Order Number: <strong>${orderData.orderNumber}</strong>
        </p>
      </div>

      <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #374151; margin-bottom: 15px;">Order Details</h3>
        ${orderData.items.map((item: any) => `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
            <div>
              <p style="color: #374151; margin: 0 0 5px 0; font-weight: 600;">${item.name}</p>
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}
              </p>
            </div>
            <p style="color: #374151; margin: 0; font-weight: 600;">
              ₹${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        `).join('')}

        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #374151;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="color: #374151;">₹${orderData.pricing.subtotal.toFixed(2)}</span>
          </div>
          ${orderData.pricing.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Discount:</span>
              <span style="color: #ef4444;">-₹${orderData.pricing.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #6b7280;">Shipping:</span>
            <span style="color: #374151;">₹${orderData.pricing.shipping.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px;">
            <span style="color: #374151;">Total:</span>
            <span style="color: #374151;">₹${orderData.pricing.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #374151; margin-bottom: 15px;">Shipping Address</h3>
        <p style="color: #6b7280; line-height: 1.6; margin: 0;">
          ${orderData.shippingAddress.street}<br>
          ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} - ${orderData.shippingAddress.pincode}<br>
          ${orderData.shippingAddress.phone ? orderData.shippingAddress.phone : ''}
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0;">
          © 2024 Myntra Clone. All rights reserved.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Order Confirmation - ${orderData.orderNumber}`,
    html,
  });
};