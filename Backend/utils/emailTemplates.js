export const getTeamIdEmailTemplate = (teamName, teamId) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campus Heist</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#ffffff;
  color:#000;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
">

  <div style="
    max-width:420px;
    margin:0 auto;
    padding:24px 16px;
  ">

    <div style="
      border:2.5px solid #000;
      padding:24px 20px;
    ">

      <!-- Title -->
      <h1 style="
        margin:0 0 18px 0;
        font-size:24px;
        font-weight:900;
        text-transform:uppercase;
        letter-spacing:-0.6px;
        text-align:center;
      ">
        Campus Heist
      </h1>

      <!-- Sub line -->
      <p style="
        margin:0 0 14px 0;
        font-size:15px;
        line-height:1.55;
        text-align:center;
        font-weight:600;
      ">
        <strong>Gotham AI</strong> welcomes you to the<br/>
        <strong>Treasure Hunt</strong>
      </p>

      <p style="
        margin:0 0 20px 0;
        font-size:14px;
        line-height:1.6;
        text-align:center;
        font-weight:500;
      ">
        Your team has been successfully registered.
        Keep your Team ID safe.
      </p>

      <!-- Label -->
      <p style="
        margin:0 0 6px 0;
        font-size:11px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:1px;
      ">
        Team ID
      </p>

      <!-- Team ID -->
      <div style="
        border:2.5px solid #000;
        padding:14px;
        margin-bottom:16px;
        text-align:center;
        font-family:
          'SFMono-Regular',
          Menlo,
          Monaco,
          Consolas,
          'Liberation Mono',
          'Courier New',
          monospace;
        font-size:22px;
        font-weight:800;
        letter-spacing:1.4px;
        word-break:break-word;
      ">
        ${teamId}
      </div>

      <!-- Team name -->
      <p style="
        margin:0 0 24px 0;
        font-size:12px;
        text-transform:uppercase;
        letter-spacing:0.6px;
        font-weight:600;
      ">
        Team Name: <strong>${teamName}</strong>
      </p>

      <!-- CTA -->
      <a href="https://treasurehunt-gotham-ai.vercel.app/login"
        style="
          display:block;
          width:100%;
          padding:14px 0;
          border:2.5px solid #000;
          text-align:center;
          text-decoration:none;
          color:#000;
          font-weight:900;
          text-transform:uppercase;
          font-size:13px;
          letter-spacing:0.6px;
        ">
        Go to Login
      </a>

      <p style="
        margin-top:28px;
        font-size:10.5px;
        line-height:1.5;
        text-transform:uppercase;
        letter-spacing:0.6px;
        font-weight:600;
      ">
        Automated message. Do not reply or share your Team ID.
      </p>

    </div>
  </div>

</body>
</html>
`;
};

export const getOtpEmailTemplate = (otp, teamId) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#ffffff;
  color:#000;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
">

  <div style="
    max-width:420px;
    margin:0 auto;
    padding:24px 16px;
  ">

    <div style="
      border:2.5px solid #000;
      padding:24px 20px;
      text-align:center;
    ">

      <!-- Title -->
      <h1 style="
        margin:0 0 18px 0;
        font-size:24px;
        font-weight:900;
        text-transform:uppercase;
        letter-spacing:-0.6px;
      ">
        Reset Request
      </h1>

      <p style="
        margin:0 0 20px 0;
        font-size:14px;
        line-height:1.6;
        font-weight:500;
      ">
        A password reset was requested for your team account.
        Use the OTP below to complete the process.
      </p>

      <!-- Label -->
      <p style="
        margin:0 0 6px 0;
        font-size:11px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:1px;
      ">
        One-Time Password
      </p>

      <!-- OTP -->
      <div style="
        border:2.5px solid #000;
        padding:14px;
        margin-bottom:24px;
        font-family:
          'SFMono-Regular',
          Menlo,
          Monaco,
          Consolas,
          'Liberation Mono',
          'Courier New',
          monospace;
        font-size:32px;
        font-weight:900;
        letter-spacing:4px;
      ">
        ${otp}
      </div>

      <!-- Team ID Reminder -->
      <p style="
        margin:0 0 6px 0;
        font-size:11px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:1px;
        text-align:center;
      ">
        Your Team ID
      </p>
      <div style="
        background:#f4f4f5;
        border:1px solid #000;
        padding:8px;
        margin-bottom:24px;
        text-align:center;
        font-family:monospace;
        font-size:16px;
        font-weight:700;
      ">
        ${teamId}
      </div>

      <p style="
        margin:0 0 20px 0;
        font-size:12px;
        line-height:1.5;
        font-weight:600;
      ">
        This OTP is valid for 10 minutes.<br/>
        If you did not request this, please ignore this email.
      </p>

      <p style="
        margin-top:28px;
        font-size:10.5px;
        line-height:1.5;
        text-transform:uppercase;
        letter-spacing:0.6px;
        font-weight:600;
        border-top:1px solid #eee;
        padding-top:12px;
      ">
        Campus Heist | Gotham AI
      </p>

    </div>
  </div>

</body>
</html>
`;
};
