import { FastifyInstance } from "fastify";
import { fastifyMultipart } from '@fastify/multipart'
import path from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import fs from "node:fs";
import { prisma } from "../lib/prisma";

const pump = promisify(pipeline) // conversão de API antiga, pra funcionar o asyn await

export async function uploadVideoRoute(app: FastifyInstance) {

       
    app.register(fastifyMultipart,{ 
        limits:{
            fileSize: 1_048_576 * 25, //25mb

        }
    });

    app.post('/videos', async (resquest, reply) => {
        const data = await resquest.file();

        if(!data){
            return reply.status(400).send({error:'Missing file input.'})
        }

        const extension = path.extname(data.filename)

        if(extension != '.mp3'){

            return reply.status(400).send({error:'Invalid input type, please upload a MP3.'})

        }


        //example mp3

        const fileBaseName = path.basename(data.filename, extension);
        const fileNameUploadName = `${fileBaseName}-${randomUUID()}${extension}`
        
        const uploadDestination = path.resolve(__dirname, '../../tmp', fileNameUploadName)

        await pump(data.file, fs.createWriteStream(uploadDestination))//FILE STREAM RGRAVA AOS POUCOS
    
        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadDestination
            }
        })

        return {
            video
        }
    })

}