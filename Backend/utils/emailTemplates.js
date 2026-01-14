export const getTeamIdEmailTemplate = (teamName, teamId) => {
  return `
    <div style="background-color: #f4f4f5; padding: 40px; font-family: Verdana, sans-serif;">
      <div style="background-color: #ffffff; border: 4px solid #000000; max-width: 600px; margin: 0 auto; padding: 0;">
        
        <!-- Header -->
        <div style="border-bottom: 4px solid #000000; padding: 20px; background-color: #000000; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">
            Mission Briefing
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; color: #555;">
            Attention Agent:
          </p>
          <p style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin-top: 0; color: #000;">
            ${teamName}
          </p>

          <hr style="border: 0; border-top: 2px dashed #000; margin: 20px 0;" />

          <p style="font-size: 14px; color: #333; line-height: 1.5;">
            Your team has been activated for the upcoming operation. 
            Below is your unique identifier required for secure login.
          </p>

          <!-- Team ID Box -->
          <div style="margin: 30px 0; background-color: #000000; color: #ffffff; padding: 20px; text-align: center; border: 2px solid #000; box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.2);">
            <p style="margin: 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #ccc;">
              Your Team ID
            </p>
            <h2 style="margin: 10px 0 0 0; font-size: 32px; letter-spacing: 3px; font-weight: 900; text-transform: uppercase;">
              ${teamId}
            </h2>
          </div>

          <p style="font-size: 12px; color: #666; font-style: italic;">
            Do not share this credential with unauthorized personnel.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f4f4f5; border-top: 4px solid #000000; padding: 15px; text-align: center;">
          <p style="margin: 0; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #000;">
            TreasureHunt HQ &bull; Secure Transmission
          </p>
        </div>
      </div>
    </div>
  `;
};
