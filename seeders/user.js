import {faker,simpleFaker} from '@faker-js/faker';
import { User } from '../Models/user.js';
import { Chat } from '../Models/chat.js';
import { Message } from '../Models/message.js';

const createUser = async (numUsers) => {
    try{

        const usersPromise = [];

        for(let i = 0; i < numUsers; i++){
            const tempUser = User.create({
                name: faker.person.fullName(),
                username: faker.internet.userName(),
                bio: faker.lorem.sentence(10),
                password: "password",
                avatar: {
                    url: faker.image.avatar(),
                    public_id: faker.system.fileName(),
                },
            });
            usersPromise.push(tempUser);
        }

        await Promise.all(usersPromise);

        console.log("Users Created", numUsers);

        process.exit(1);

    } catch (error){
        console.error(error);
        process.exit(1);
    }
}

const createSampleChat = async (numChats) => {
    try{
        const users = await User.find().select("_id");

        const chatsPromise = [];

        for(let i=0;i<users.length; i++){
            for(let j=i+1;j<users.length;j++){
                chatsPromise.push(
                    Chat.create({
                        name: faker.lorem.words(2),
                        members: [users[i],users[j]],
                    })
                );
            }
        }

        await Promise.all(chatsPromise);

        console.log("chats created successfully");
        process.exit(1);
    } catch(error){
        console.error(error);
        process.exit(1);
    }
};

const createSampleGroupChats = async (numChats) => {
    try{
        const users = await User.find().select("_id");

        const chatsPromise = [];

        for(let i=0;i<numChats;i++){
            const numMembers = simpleFaker.number.int({min:3,max:users.length});
            const members = [];

            for(let i=0;i<numMembers;i++){
                const randomIndex = Math.floor(Math.random()*users.length);
                const randomUser = users[randomIndex];

                if(!members.includes(randomUser)){
                    members.push(randomUser);
                }
            }

            const chat = Chat.create({
                groupChat: true,
                name:faker.lorem.words(1),
                members,
                creator: members[0],
            });

            chatsPromise.push(chat);
        }

        await Promise.all(chatsPromise);

        console.log("Chats created successfully");
        process.exit(1);
    } catch(error){
        console.error(error);
        process.exit(1);
    }
};

const createMessage = async (numMessages) => {
    try{
        const users = await User.find().select("_id");
        const chats = await Chat.find().select("_id");

        const messagesPromise = [];

        for(let i = 0;i<numMessages; i++){
            const randomUser = users[Math.floor(Math.random()* users.length)];
            const randomChat = chats[Math.floor(Math.random()*chats.length)];

            messagesPromise.push(
                Message.create({
                    chat:randomChat,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messagesPromise);

        console.log("Messages created successfully");
        process.exit();
    }  catch(error){
        console.error(error);
        process.exit(1);
    }
};

const createMessageInTheChat = async (chatId,numMessages) => {
    try{
        const users = await User.find().select("_id");

        const messagesPromise = [];

        for(let i = 0;i<numMessages; i++){
            const randomUser = users[Math.floor(Math.random()* users.length)];

            messagesPromise.push(
                Message.create({
                    chat:chatId,
                    sender: randomUser,
                    content: faker.lorem.sentence(),
                })
            );
        }

        await Promise.all(messagesPromise);

        console.log("Messages created successfully");
        process.exit();
    }  catch(error){
        console.error(error);
        process.exit(1);
    }
};



export {
    createUser,
    createSampleChat,
    createSampleGroupChats,
    createMessage,
    createMessageInTheChat,
};