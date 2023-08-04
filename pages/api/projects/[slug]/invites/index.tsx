import { hashToken, withProjectAuth } from "#/lib/auth";
import prisma from "#/lib/prisma";
import { sendEmail } from "emails";
import { randomBytes } from "crypto";
import ProjectInvite from "emails/project-invite";

export default withProjectAuth(async (req, res, project, session) => {
  // GET /api/projects/[slug]/invites - Get all pending invites for a project
  if (req.method === "GET") {
    const invites = await prisma.projectInvite.findMany({
      where: {
        projectId: project.id,
      },
      select: {
        email: true,
        createdAt: true,
      },
    });
    return res.status(200).json(
      invites.map((invite) => ({
        email: invite.email,
        joinedAt: invite.createdAt,
      })),
    );

    // POST /api/projects/[slug]/invites – invite a teammate
  } else if (req.method === "POST") {
    const { email } = req.body;

    const alreadyInTeam = await prisma.projectUsers.findFirst({
      where: {
        projectId: project.id,
        user: {
          email,
        },
      },
    });
    if (alreadyInTeam) {
      return res.status(400).end("User already exists in this project.");
    }

    if (project.plan === "free") {
      const users = await prisma.projectUsers.count({
        where: {
          projectId: project.id,
        },
      });
      const invites = await prisma.projectInvite.count({
        where: {
          projectId: project.id,
        },
      });
      if (users + invites >= 3) {
        return res
          .status(400)
          .end("You've reached the maximum number of users for the free plan.");
      }
    }

    // same method of generating a token as next-auth
    const token = randomBytes(32).toString("hex");
    const TWO_WEEKS_IN_SECONDS = 60 * 60 * 24 * 14;
    const expires = new Date(Date.now() + TWO_WEEKS_IN_SECONDS * 1000);

    // create a project invite record and a verification request token that lasts for a week
    // here we use a try catch to account for the case where the user has already been invited
    // for which `prisma.projectInvite.create()` will throw a unique constraint error
    try {
      await prisma.projectInvite.create({
        data: {
          email,
          expires,
          projectId: project.id,
        },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: hashToken(token),
          expires,
        },
      });

      const params = new URLSearchParams({
        callbackUrl: `${process.env.NEXTAUTH_URL}/${project.slug}`,
        email,
        token,
      });

      const url = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?${params}`;

      sendEmail({
        subject: "You've been invited to join a project on Dub",
        email,
        react: ProjectInvite({
          email,
          url,
          projectName: project.name,
          projectUser: session.user.name,
          projectUserEmail: session.user.email,
        }),
      });

      return res.status(200).json({ message: "Invite sent" });
    } catch (error) {
      return res.status(400).end("User already invited.");
    }

    // DELETE /api/projects/[slug]/invites – delete a pending invite
  } else if (req.method === "DELETE") {
    const { email } = req.query as { email?: string };
    if (!email) {
      return res.status(400).end("Missing email");
    }
    const response = await prisma.projectInvite.delete({
      where: {
        email_projectId: {
          email,
          projectId: project.id,
        },
      },
    });
    return res.status(200).json(response);
  } else {
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});
