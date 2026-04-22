import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  "hagyeong2022@gmail.com",
  "surimlee96@gmail.com",
  "joeunsora@gmail.com",
  "pomme21152011@gmail.com",
  "jesse9402@gmail.com",
  "sparklinleaf@gmail.com",
  "sbahylee@gmail.com",
];

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      return ALLOWED_EMAILS.includes(user.email ?? "");
    },
  },
});

export { handler as GET, handler as POST };
