const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.addData = async (req, res) => {
  const { data } = req.body;

  try {
    await prisma.data.create({ data: { content: data } });
    res.status(200).json({ message: 'Data added successfully' });
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.getData = async (_, res) => {
  try {
    const data = await prisma.data.findMany();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error });
  }
};
