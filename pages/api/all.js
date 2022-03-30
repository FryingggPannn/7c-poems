// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Sequelize } from 'sequelize';
import models from "../../models/models";
// import { models } from '@next-auth/sequelize-adapter';
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: "./maindb.db"
});

sequelize.sync()
export default async function handler(req, res) {
  await sequelize.sync();
  const User = models.User(sequelize)
  
  const time = Date.now();
  const users = await User.findAll();
  const timeend = Date.now();

  res.status(200).json({ time: timeend - time, users: users});
}
