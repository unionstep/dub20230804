import { deleteUserLinks } from "#/lib/api/links";
import { withUserAuth } from "#/lib/auth";
import prisma from "#/lib/prisma";

export default withUserAuth(async (req, res, session) => {
  // PUT /api/user – edit a specific user
  if (req.method === "PUT") {
    const { name, email, image } = req.body;
    try {
      const response = await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(image && { image }),
        },
      });
      return res.status(200).json(response);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(422).end("Email is already in use.");
      }
    }
    // DELETE /api/user – delete a specific user
  } else if (req.method === "DELETE") {
    const userIsOwnerOfProjects = await prisma.projectUsers.findMany({
      where: {
        userId: session.user.id,
        role: "owner",
      },
    });
    if (userIsOwnerOfProjects.length > 0) {
      return res
        .status(422)
        .end(
          "You must transfer ownership of your projects or delete them before you can delete your account.",
        );
    } else {
      const deleteLinks = await deleteUserLinks(session.user.id);
      const response = await prisma.user.delete({
        where: {
          id: session.user.id,
        },
      });
      return res.status(200).json({ deleteLinks, response });
    }
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});
