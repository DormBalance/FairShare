import {supabase} from "./supabaseClient";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({adapter});

export async function requireUser() {
    const { data: {user} } = await supabase.auth.getUser();

    if(!user){
        throw Error('User not found');
    }
    return user;
}

export async function requireMembership(householdid: bigint) {

    const user = await requireUser();
    if (!user) {
        throw Error('User not found');
    }

    const database_user = await prisma.users.findFirst({where: {email: user.email}});
    if (!database_user) {
        throw Error('User not found');
    }
    const membership = await prisma.household_members.findFirst({
        where:
            {
                household_id: householdid,
                user_id: database_user.id
            },
    });

    if (!membership) {
        return false;
    }
    else{
        return true;
    }
}

    export async function requireAdmin(householdid: bigint): Promise<boolean> {

        const user = await requireUser();
        if (!user) {
            throw Error('User not found');
        }

        const database_user = await prisma.users.findFirst({where: {email: user.email}});
        if (!database_user) {
            throw Error('User not found');
        }
        const membership = await prisma.household_members.findFirst({
            where:
                {user_id: database_user.id},
        });

        if (!membership) {
            throw Error('Not a member of that household');
        }

        if (membership.role == 'Admin') {
            return true;
        } else {
            return false;
        }
    }

