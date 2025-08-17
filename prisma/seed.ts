import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.create({
    data: {
      destination: "Rejkiawik",
      description: "Wycieczka do Islandii",
      start_date: new Date("2025-09-01"),
      end_date: new Date("2025-09-15"),
    },
  });

  const participant1 = await prisma.participant.create({
    data: {
      first_name: "Jan",
      last_name: "Kowalski",
      email: "jan.kowalski@example.com",
      phone: "+48123456789",
    },
  });

  const participant2 = await prisma.participant.create({
    data: {
      first_name: "Anna",
      last_name: "Nowak",
      email: "anna.nowak@example.com",
      phone: "+48123456788",
    },
  });

  const _expense1 = await prisma.expense.create({
    data: {
      amount: 234.56,
      category: "TRANSPORT",
      description: "Bilet lotniczy",
      trip_id: trip.trip_id,
    },
  });

  const _expense2 = await prisma.expense.create({
    data: {
      amount: 150,
      category: "FOOD",
      description: "Obiad w restauracji",
      trip_id: trip.trip_id,
    },
  });

  const _tripParticipants = await prisma.tripParticipants.create({
    data: {
      trip_id: trip.trip_id,
      participant_id: participant1.participant_id,
    },
  });

  const _tripParticipants2 = await prisma.tripParticipants.create({
    data: {
      trip_id: trip.trip_id,
      participant_id: participant2.participant_id,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
