import { FastifyInstance } from "fastify";
import { prisma } from "./lib/prisma";
import dayjs from "dayjs";
import { z } from "zod";

export async function AppRoutes(app: FastifyInstance) {
  app.get("/hello2", async () => {
    const habits = await prisma.habit.findMany({
      where: {
        title: {
          startsWith: "beber",
        },
      },
    });

    return habits;
  });

  app.post("/habits", async (request) => {
    const createHabitBody = z.object({
      title: z.string(),
      weekDays: z.array(z.number().min(0).max(6)),
    });
    const { title, weekDays } = createHabitBody.parse(request.body);
    // cria a data com a hora 00:00
    const today = dayjs().startOf("day").toDate();
    await prisma.habit.create({
      data: {
        title,
        created_at: today,
        weekDays: {
          create: weekDays.map((weekDay) => {
            return {
              week_day: weekDay,
            };
          }),
        },
      },
    });
  });

  app.get("/day", async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date() // converte string para date
    });
    const { date } = getDayParams.parse(request.query);
    const parsedDate = dayjs(date).startOf("day");
    const weekDay = parsedDate.get("day");
    // todos hábitos possívels
    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date,
        },
        weekDays: {
          some: {
            week_day: weekDay,
          },
        },
      },
    });
    // todos hábitos realizados
    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate(),
      },
      include: {
        dayHabits: true,
      },
    });
    const completedHabit = day?.dayHabits.map((dayHabit) => {
      dayHabit.habit_id;
    });
    return {
      possibleHabits,
      completedHabit
    };
  });

app.patch("/habits/:id/toggle", async (request) => {
  const toggleHabitParams = z.object({
    id: z.string().uuid(),
  });

  const { id } = toggleHabitParams.parse(request.params);

  // recupera o dia de hoje, sem hora, minuto e segundo
  const today = dayjs().startOf("day").toDate();

  // verifica se o dia já existe
  let day = await prisma.day.findUnique({
    where: {
      date: today,
    },
  });
  // caso o dia não tenha sido criado ainda, pois apenas dias com hábitos
  // completados, existem
  if (!day) {
    day = await prisma.day.create({
      data: {
        date: today,
      },
    });
  }
  // procura para saber se o hábito já foi completado
  const dayHabit = await prisma.dayHabit.findUnique({
    where: {
      day_id_habit_id: {
        day_id: day.id,
        habit_id: id,
      },
    },
  });
  // se já foi completado
  if (dayHabit) {
    // remove marcação
    await prisma.dayHabit.delete({
      where: {
        id: dayHabit.id,
      },
    });
  } else {
    //não foi completada, então cria
    await prisma.dayHabit.create({
      data: {
        day_id: day.id,
        habit_id: id,
      },
    });
  }
});

  
}
