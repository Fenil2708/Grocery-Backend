const VerificationEmail = (username, otp) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333;
    }
    
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .header h1 {
      color: #4CAF50;
      font-size: 24px;
      margin: 0;
    }
    
    .content {
      text-align: center;
    }
    
    .content p {
      font-size: 16px;
      line-height: 1.5;
      margin: 10px 0;
    }
    
    .otp {
      font-size: 32px;
      font-weight: bold;
      color: #4CAF50;
      margin: 25px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
      letter-spacing: 5px;
      display: inline-block;
    }
    
    .footer {
      text-align: center;
      font-size: 14px;
      color: #777;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hi ${username}, Please Verify Your Email Address</h1>
    </div>
    
    <div class="content">
      <p>Thank you for registering with BroBazar. Please use the OTP below to verify your email address:</p>
      
      <div class="otp">${otp}</div>
      
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>This OTP will expire in 10 minutes.</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 BroBazar. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

export default VerificationEmail;