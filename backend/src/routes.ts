import {FastifyInstance} from 'fastify'
import { prisma } from "./lib/prisma"
export async function AppRoutes(app: FastifyInstance){
app.get('/hello2', async () => {
    const habits = await prisma.habit.findMany({
        where: {
            title: {
                startsWith: 'beber'
            }
        }        
    })

    return habits
})}
