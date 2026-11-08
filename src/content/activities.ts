import type { Activity } from "./types";

const driveFile = (id: string) => `https://drive.google.com/file/d/${id}/view`;

export const ACTIVITIES = [
  {
    slug: "world-teachers-day-2026",
    title: "World Teachers' Day 2026",
    caption:
      "To honor the dedication and service of teachers, this celebration recognized their contributions to learners and the school community through a programme led by the SSLG and LGCC.",
    cover: { kind: "album", album: "1yVIUPC5q0G8EsRahOUxbHG_EvSByCXlz" },
    album: "1yVIUPC5q0G8EsRahOUxbHG_EvSByCXlz",
    reportUrl: driveFile("1KiYs31znp_3EKYMNV0hxJCQvcK90mtws"),
    featured: true,
  },
  {
    slug: "lgcc-clean-up-2026",
    title: "LGCC Clean-Up Drive – Project ECOLEAD",
    caption:
      "To promote environmental stewardship and maintain a clean learning environment, the LGCC and SSLG led a school-wide clean-up drive under Project ECOLEAD.",
    cover: { kind: "album", album: "1_0DykrJF1DVEzwo19m9mbgAp2HRi85ix" },
    album: "1_0DykrJF1DVEzwo19m9mbgAp2HRi85ix",
    reportUrl: driveFile("10EnbVjEL94AXwWm4IeW5QRCi29Z9tJy5"),
  },
  {
    slug: "earthquake-drill-2026",
    title: "National Simultaneous Earthquake Drill 2026",
    caption:
      "To strengthen disaster preparedness and safety awareness, SSLG officers and Red Cross Youth members joined the 2026 National Simultaneous Earthquake Drill.",
    cover: { kind: "album", album: "1UT4M9b8TrctZ-d-tGjAEPbLADbUo_ik8" },
    album: "1UT4M9b8TrctZ-d-tGjAEPbLADbUo_ik8",
  },
  {
    slug: "election-registered-clubs-2026",
    title: "Election of Registered School Clubs and Organizations",
    caption:
      "To promote democratic participation and student leadership, this activity elected the officers of registered school clubs and organizations.",
    cover: { kind: "doc", fileId: "11NW0ZtYcFbPeRcNgpFwT26_IJUln8n1S" },
    reportUrl: driveFile("11NW0ZtYcFbPeRcNgpFwT26_IJUln8n1S"),
  },
  {
    slug: "gpoa-crafting-2026",
    title: "Crafting of the SSLG General Plan of Action",
    caption:
      "To set the direction of student-led programmes for the school year, the SSLG crafted its General Plan of Action with the guidance of the LGCC and advisers.",
    cover: { kind: "doc", fileId: "1pdEWqxhVOBNwM71FUpsyVNdwUjCbezWJ" },
    reportUrl: driveFile("1pdEWqxhVOBNwM71FUpsyVNdwUjCbezWJ"),
  },
  {
    slug: "brigada-eskwela-2026",
    title: "Brigada Eskwela 2026",
    caption:
      "To prepare the school facilities for the opening of classes, the SSLG, LGCC, and registered clubs and organizations took part in Brigada Eskwela.",
    cover: { kind: "album", album: "1p-60nKJtTiACOF1Kkj8OLCuEFlnhR1sn" },
    album: "1p-60nKJtTiACOF1Kkj8OLCuEFlnhR1sn",
    reportUrl: driveFile("16KFJZmhSiTPeEV0JIO8ttj894RZBbuQQ"),
  },
  {
    slug: "club-organizations-membership-drive-2026",
    title: "Club and Organizations Membership Drive",
    caption:
      "To foster enhanced student engagement and dedication, this project helped the students pick what fits their interests and goals that will also help them feel more involved in their community.",
    cover: { kind: "album", album: "1S6yMnWlYO_ilgiwc5akv32WAOYmI3rtf" },
    album: "1S6yMnWlYO_ilgiwc5akv32WAOYmI3rtf",
    reportUrl: driveFile("1ZRyWYuL4w1oZcgo0V5HU-vr0JMq6g-4Y"),
  },
  {
    slug: "grade-7-representatives-election-2026",
    title: "Grade 7 Representatives Election for the S.Y 2026-2027",
    caption:
      "To promote student leadership, this project facilitated the election of Grade 7 Representatives who now serve as the official spokespeople of their year level within the Supreme Secondary Learner Government (SSLG).",
    cover: { kind: "album", album: "1y2tKu7-5uoxBK-jQ2dN0sEIqCj2tL8av" },
    album: "1y2tKu7-5uoxBK-jQ2dN0sEIqCj2tL8av",
    reportUrl: driveFile("168M9PVEHlju8RL0DRNUwljBU9BPS0pGa"),
  },
  {
    slug: "induction-ceremony-2026",
    title: "Onto the Next Leaders Induction Ceremony",
    caption:
      "To instill a sense of responsibility, leadership, and commitment among the officers, this event formally introduced and recognized the newly elected student leaders.",
    cover: { kind: "album", album: "1iPxMcxI61C0pIZDc_2raj4IYfZAyxLL_" },
    album: "1iPxMcxI61C0pIZDc_2raj4IYfZAyxLL_",
    reportUrl: driveFile("1omiyOdHtxgngsb7WMcpNGTaZsaMBgrYE"),
  },
  {
    slug: "project-tinig",
    title: "Project Tinig",
    caption:
      "To strengthen transparency, accountability, and student participation by establishing an online platform where students can access SSLG reports, announcements, financial summaries, and submit feedback or concerns, ensuring that every voice is heard.",
    cover: { kind: "none" },
  },
] satisfies Activity[];
