export interface Customer {
  id: string;
  name: string;
  email: string;
  cardNumber: string;
  currentStamps: number;
  membershipDate: string;
  lifetimePurchases: number;
  status: "Active" | "Inactive";
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  action: string;
  detail: string;
  date: string;
}

export const generateMockCustomers = (): Customer[] => {
  // Generate a large history for John Cruz to test scrollable modals
  const johnCruzActivities: Activity[] = [];
  let currentDate = new Date(2025, 0, 1); // Start in early 2025

  for (let i = 1; i <= 25; i++) {
    const isRedemption = i % 10 === 0;
    currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 15) + 1);
    
    johnCruzActivities.unshift({
      id: `1-act-${i}`,
      action: isRedemption ? "Redeemed Free Drink" : "Loyalty Stamp Acquired",
      detail: isRedemption ? "10 stamps used" : "+1 Stamp",
      date: currentDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    });
  }

  return [
    {
      id: "1",
      name: "John Cruz",
      email: "john@email.com",
      cardNumber: "2026 0000 0000 0154",
      currentStamps: 6,
      membershipDate: "2025-01-01",
      lifetimePurchases: 42,
      status: "Active",
      recentActivity: johnCruzActivities
    },
    {
      id: "2",
      name: "Maria Santos",
      email: "maria.s@example.com",
      cardNumber: "2026 0000 0000 0155",
      currentStamps: 9,
      membershipDate: "2026-07-20",
      lifetimePurchases: 19,
      status: "Active",
      recentActivity: [
        { id: "2a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 04, 2026" },
        { id: "2b", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 02, 2026" }
      ]
    },
    {
      id: "3",
      name: "Pedro Garcia",
      email: "pedro.garcia@test.com",
      cardNumber: "2026 0000 0000 0156",
      currentStamps: 1,
      membershipDate: "2026-08-01",
      lifetimePurchases: 11,
      status: "Active",
      recentActivity: [
        { id: "3a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Jul 30, 2026" },
        { id: "3b", action: "Redeemed Free Drink", detail: "10 stamps used", date: "Jul 30, 2026" }
      ]
    },
    {
      id: "4",
      name: "Ana Reyes",
      email: "ana.reyes@mail.com",
      cardNumber: "2026 0000 0000 0157",
      currentStamps: 0,
      membershipDate: "2026-05-15",
      lifetimePurchases: 5,
      status: "Inactive",
      recentActivity: [
        { id: "4a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "May 15, 2026" }
      ]
    },
    {
      id: "5",
      name: "David Lim",
      email: "david.lim@example.ph",
      cardNumber: "2026 0000 0000 0158",
      currentStamps: 10,
      membershipDate: "2026-06-10",
      lifetimePurchases: 30,
      status: "Active",
      recentActivity: [
        { id: "5a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 05, 2026" }
      ]
    },
    {
      id: "6",
      name: "Sophia Ocampo",
      email: "sophia.o@email.com",
      cardNumber: "2026 0000 0000 0159",
      currentStamps: 4,
      membershipDate: "2026-08-02",
      lifetimePurchases: 14,
      status: "Active",
      recentActivity: [
        { id: "6a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 06, 2026" }
      ]
    },
    {
      id: "7",
      name: "Jose Mendoza",
      email: "jmendoza@test.com",
      cardNumber: "2026 0000 0000 0160",
      currentStamps: 7,
      membershipDate: "2026-04-22",
      lifetimePurchases: 67,
      status: "Active",
      recentActivity: [
        { id: "7a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 01, 2026" },
        { id: "7b", action: "Redeemed Free Drink", detail: "10 stamps used", date: "Jul 06, 2026" }
      ]
    },
    {
      id: "8",
      name: "Isabella Tan",
      email: "isabella.t@mail.com",
      cardNumber: "2026 0000 0000 0161",
      currentStamps: 2,
      membershipDate: "2026-07-30",
      lifetimePurchases: 12,
      status: "Active",
      recentActivity: [
        { id: "8a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 03, 2026" }
      ]
    },
    {
      id: "9",
      name: "Miguel Bautista",
      email: "miguel.b@example.com",
      cardNumber: "2026 0000 0000 0162",
      currentStamps: 8,
      membershipDate: "2026-01-11",
      lifetimePurchases: 88,
      status: "Active",
      recentActivity: [
        { id: "9a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 05, 2026" }
      ]
    },
    {
      id: "10",
      name: "Carmen Villanueva",
      email: "carmen.v@test.com",
      cardNumber: "2026 0000 0000 0163",
      currentStamps: 5,
      membershipDate: "2026-03-05",
      lifetimePurchases: 25,
      status: "Active",
      recentActivity: [
        { id: "10a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Jul 30, 2026" }
      ]
    },
    {
      id: "11",
      name: "Luis Gonzales",
      email: "luis.g@email.com",
      cardNumber: "2026 0000 0000 0164",
      currentStamps: 3,
      membershipDate: "2025-11-20",
      lifetimePurchases: 103,
      status: "Active",
      recentActivity: [
        { id: "11a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 04, 2026" },
        { id: "11b", action: "Redeemed Free Drink", detail: "10 stamps used", date: "Jun 06, 2026" }
      ]
    },
    {
      id: "12",
      name: "Elena Pascual",
      email: "elena.p@mail.com",
      cardNumber: "2026 0000 0000 0165",
      currentStamps: 9,
      membershipDate: "2026-02-14",
      lifetimePurchases: 39,
      status: "Active",
      recentActivity: [
        { id: "12a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 05, 2026" }
      ]
    },
    {
      id: "13",
      name: "Roberto Cruz",
      email: "roberto.c@example.ph",
      cardNumber: "2026 0000 0000 0166",
      currentStamps: 6,
      membershipDate: "2026-05-30",
      lifetimePurchases: 26,
      status: "Active",
      recentActivity: [
        { id: "13a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 02, 2026" }
      ]
    },
    {
      id: "14",
      name: "Lucia Navarro",
      email: "lucia.n@test.com",
      cardNumber: "2026 0000 0000 0167",
      currentStamps: 0,
      membershipDate: "2025-08-10",
      lifetimePurchases: 2,
      status: "Inactive",
      recentActivity: [
        { id: "14a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 10, 2025" }
      ]
    },
    {
      id: "15",
      name: "Gabriel Ramos",
      email: "gabriel.r@email.com",
      cardNumber: "2026 0000 0000 0168",
      currentStamps: 1,
      membershipDate: "2026-08-03",
      lifetimePurchases: 1,
      status: "Active",
      recentActivity: [
        { id: "15a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 03, 2026" }
      ]
    },
    {
      id: "16",
      name: "Teresa Domingo",
      email: "teresa.d@mail.com",
      cardNumber: "2026 0000 0000 0169",
      currentStamps: 8,
      membershipDate: "2026-06-25",
      lifetimePurchases: 18,
      status: "Active",
      recentActivity: [
        { id: "16a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 06, 2026" }
      ]
    },
    {
      id: "17",
      name: "Juanito Perez",
      email: "juanito.p@example.com",
      cardNumber: "2026 0000 0000 0170",
      currentStamps: 4,
      membershipDate: "2026-07-12",
      lifetimePurchases: 14,
      status: "Active",
      recentActivity: [
        { id: "17a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 01, 2026" }
      ]
    },
    {
      id: "18",
      name: "Rosa Medina",
      email: "rosa.m@test.com",
      cardNumber: "2026 0000 0000 0171",
      currentStamps: 7,
      membershipDate: "2026-01-28",
      lifetimePurchases: 47,
      status: "Active",
      recentActivity: [
        { id: "18a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Jul 30, 2026" },
        { id: "18b", action: "Redeemed Free Drink", detail: "10 stamps used", date: "Jun 06, 2026" }
      ]
    },
    {
      id: "19",
      name: "Antonio Aguilar",
      email: "antonio.a@email.com",
      cardNumber: "2026 0000 0000 0172",
      currentStamps: 2,
      membershipDate: "2026-08-01",
      lifetimePurchases: 2,
      status: "Active",
      recentActivity: [
        { id: "19a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 05, 2026" }
      ]
    },
    {
      id: "20",
      name: "Sofia Castro",
      email: "sofia.c@mail.com",
      cardNumber: "2026 0000 0000 0173",
      currentStamps: 9,
      membershipDate: "2026-04-18",
      lifetimePurchases: 29,
      status: "Active",
      recentActivity: [
        { id: "20a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 04, 2026" }
      ]
    },
    {
      id: "21",
      name: "Diego Salazar",
      email: "diego.s@example.ph",
      cardNumber: "2026 0000 0000 0174",
      currentStamps: 5,
      membershipDate: "2026-07-05",
      lifetimePurchases: 15,
      status: "Active",
      recentActivity: [
        { id: "21a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 02, 2026" }
      ]
    },
    {
      id: "22",
      name: "Valeria Gomez",
      email: "valeria.g@test.com",
      cardNumber: "2026 0000 0000 0175",
      currentStamps: 3,
      membershipDate: "2025-12-10",
      lifetimePurchases: 53,
      status: "Active",
      recentActivity: [
        { id: "22a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Jul 30, 2026" }
      ]
    },
    {
      id: "23",
      name: "Emilio Cortez",
      email: "emilio.c@email.com",
      cardNumber: "2026 0000 0000 0176",
      currentStamps: 0,
      membershipDate: "2024-05-22",
      lifetimePurchases: 4,
      status: "Inactive",
      recentActivity: [
        { id: "23a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Feb 06, 2025" }
      ]
    },
    {
      id: "24",
      name: "Camila Fernandez",
      email: "camila.f@mail.com",
      cardNumber: "2026 0000 0000 0177",
      currentStamps: 6,
      membershipDate: "2026-03-30",
      lifetimePurchases: 36,
      status: "Active",
      recentActivity: [
        { id: "24a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 06, 2026" }
      ]
    },
    {
      id: "25",
      name: "Javier Roxas",
      email: "javier.r@example.com",
      cardNumber: "2026 0000 0000 0178",
      currentStamps: 8,
      membershipDate: "2026-02-05",
      lifetimePurchases: 78,
      status: "Active",
      recentActivity: [
        { id: "25a", action: "Loyalty Stamp Acquired", detail: "+1 Stamp", date: "Aug 05, 2026" }
      ]
    }
  ];
};
