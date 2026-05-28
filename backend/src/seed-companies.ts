import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding companies...');

  const companies = await prisma.company.createMany({
    data: [
      {
        name: 'EPAM Systems',
        industry: 'IT',
        city: 'Минск',
        description: 'Ведущая IT-компания Беларуси. Разработка ПО для мировых клиентов.',
        website: 'https://epam.com',
      },
      {
        name: 'Белорусский металлургический завод',
        industry: 'Металлургия',
        city: 'Жлобин',
        description: 'Крупнейший металлургический завод Беларуси.',
        website: 'https://bmz.by',
      },
      {
        name: 'Минский тракторный завод',
        industry: 'Машиностроение',
        city: 'Минск',
        description: 'МТЗ — один из крупнейших производителей тракторов в мире.',
        website: 'https://mtz.by',
      },
      {
        name: '9-я городская клиническая больница',
        industry: 'Медицина',
        city: 'Минск',
        description: 'Многопрофильная клиническая больница Минска.',
        website: 'https://9gkb.by',
      },
      {
        name: 'Wargaming',
        industry: 'IT / GameDev',
        city: 'Минск',
        description: 'Разработчик World of Tanks и других игровых проектов.',
        website: 'https://wargaming.com',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${companies.count} companies`);

  const allCompanies = await prisma.company.findMany();
  const deadline = new Date('2026-07-15');

  for (const company of allCompanies) {
    if (company.industry === 'IT' || company.industry === 'IT / GameDev') {
      await prisma.contract.create({
        data: {
          companyId: company.id,
          title: `Целевая подготовка — разработчик ПО`,
          specialty: 'Программное обеспечение информационных технологий',
          university: 'БГУИР',
          description: `${company.name} предлагает целевое направление на обучение в БГУИР. После окончания — гарантированное трудоустройство с зарплатой от $1500.`,
          requirements: ['Средний балл от 8.0', 'Интерес к программированию', 'CRI от 60%'],
          benefits: ['Стипендия во время учёбы', 'Оплата общежития', 'Гарантированное трудоустройство', 'Зарплата от $1500'],
          minCRI: 60,
          minGrade: 8.0,
          slotsTotal: 5,
          deadline,
        },
      });
    } else if (company.industry === 'Машиностроение') {
      await prisma.contract.create({
        data: {
          companyId: company.id,
          title: 'Целевая подготовка — инженер-конструктор',
          specialty: 'Машиностроение',
          university: 'БНТУ',
          description: `${company.name} предлагает целевое направление. Работа на современном производстве с полным соцпакетом.`,
          requirements: ['Средний балл от 7.0', 'Хорошие оценки по физике и математике', 'CRI от 45%'],
          benefits: ['Стипендия 300 BYN/мес', 'Практика на предприятии', 'Гарантированное трудоустройство'],
          minCRI: 45,
          minGrade: 7.0,
          slotsTotal: 10,
          deadline,
        },
      });
    } else if (company.industry === 'Металлургия') {
      await prisma.contract.create({
        data: {
          companyId: company.id,
          title: 'Целевая подготовка — инженер-металлург',
          specialty: 'Металлургия',
          university: 'БНТУ',
          description: `${company.name} — стабильное государственное предприятие. Целевое направление с полным сопровождением.`,
          requirements: ['Средний балл от 6.5', 'CRI от 40%'],
          benefits: ['Стипендия 250 BYN/мес', 'Жильё', 'Гарантированное трудоустройство', 'Соцпакет'],
          minCRI: 40,
          minGrade: 6.5,
          slotsTotal: 15,
          deadline,
        },
      });
    } else if (company.industry === 'Медицина') {
      await prisma.contract.create({
        data: {
          companyId: company.id,
          title: 'Целевая подготовка — врач',
          specialty: 'Лечебное дело',
          university: 'БГМУ',
          description: `Целевое направление от городской клинической больницы. Гарантированное место работы после интернатуры.`,
          requirements: ['Средний балл от 8.5', 'Хорошие оценки по биологии и химии', 'CRI от 65%'],
          benefits: ['Поддержка во время учёбы', 'Гарантированное трудоустройство', 'Карьерный рост'],
          minCRI: 65,
          minGrade: 8.5,
          slotsTotal: 3,
          deadline,
        },
      });
    }
  }

  console.log('Contracts created!');
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
