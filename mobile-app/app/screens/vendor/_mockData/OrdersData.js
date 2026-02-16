export const mockOrders = [
  {
    id: 'ORD001',
    customerName: 'Ahmed Ali',
    customerPhoto: 'https://i.pravatar.cc/150?img=12',
    serviceType: 'Banquet Hall',
    packageName: 'Premium Wedding Package',
    packagePrice: 150000,
    optionalItems: [
      { name: 'Extra Decoration', price: 25000 },
      { name: 'Sound System Upgrade', price: 15000 },
    ],
    totalAmount: 190000,
    eventDate: '2026-03-15',
    eventDay: 'Sunday',
    eventTime: '6:00 PM - 11:00 PM',
    guestCount: 500,
    status: 'pending', // pending, accepted, rejected
    orderDate: '2026-02-10',
    specialRequests: 'Need parking space for 100 cars',
  },
  {
    id: 'ORD002',
    customerName: 'Fatima Khan',
    customerPhoto: 'https://i.pravatar.cc/150?img=45',
    serviceType: 'Catering',
    packageName: 'Deluxe Catering Package',
    packagePrice: 85000,
    optionalItems: [
      { name: 'Live BBQ Counter', price: 20000 },
      { name: 'Beverage Station', price: 12000 },
    ],
    totalAmount: 117000,
    eventDate: '2026-03-20',
    eventDay: 'Friday',
    eventTime: '7:00 PM - 12:00 AM',
    guestCount: 300,
    status: 'accepted',
    orderDate: '2026-02-08',
    specialRequests: 'Vegetarian options required',
  },
  {
    id: 'ORD003',
    customerName: 'Hassan Raza',
    customerPhoto: 'https://i.pravatar.cc/150?img=33',
    serviceType: 'Photography',
    packageName: 'Complete Wedding Coverage',
    packagePrice: 95000,
    optionalItems: [
      { name: 'Drone Videography', price: 35000 },
      { name: 'Same Day Edit', price: 25000 },
    ],
    totalAmount: 155000,
    eventDate: '2026-03-25',
    eventDay: 'Wednesday',
    eventTime: '3:00 PM - 11:00 PM',
    guestCount: 400,
    status: 'pending',
    orderDate: '2026-02-12',
    specialRequests: 'Need both cinematic and traditional photos',
  },
  {
    id: 'ORD004',
    customerName: 'Ayesha Malik',
    customerPhoto: 'https://i.pravatar.cc/150?img=28',
    serviceType: 'Parlor',
    packageName: 'Bridal Beauty Package',
    packagePrice: 45000,
    optionalItems: [
      { name: 'Manicure & Pedicure', price: 8000 },
      { name: 'Mehndi Design', price: 12000 },
    ],
    totalAmount: 65000,
    eventDate: '2026-03-10',
    eventDay: 'Tuesday',
    eventTime: '9:00 AM - 3:00 PM',
    guestCount: 1,
    status: 'accepted',
    orderDate: '2026-02-05',
    specialRequests: 'Prefer natural makeup look',
  },
  {
    id: 'ORD005',
    customerName: 'Bilal Ahmed',
    customerPhoto: 'https://i.pravatar.cc/150?img=51',
    serviceType: 'Banquet Hall',
    packageName: 'Standard Hall Booking',
    packagePrice: 80000,
    optionalItems: [],
    totalAmount: 80000,
    eventDate: '2026-04-05',
    eventDay: 'Sunday',
    eventTime: '5:00 PM - 10:00 PM',
    guestCount: 250,
    status: 'rejected',
    orderDate: '2026-02-11',
    specialRequests: 'Budget constraints',
  },
  {
    id: 'ORD006',
    customerName: 'Zainab Hussain',
    customerPhoto: 'https://i.pravatar.cc/150?img=49',
    serviceType: 'Catering',
    packageName: 'Premium BBQ Package',
    packagePrice: 120000,
    optionalItems: [
      { name: 'Dessert Bar', price: 18000 },
    ],
    totalAmount: 138000,
    eventDate: '2026-03-28',
    eventDay: 'Saturday',
    eventTime: '8:00 PM - 1:00 AM',
    guestCount: 350,
    status: 'pending',
    orderDate: '2026-02-14',
    specialRequests: 'Halal meat only, no seafood',
  },
  {
    id: 'ORD007',
    customerName: 'Usman Tariq',
    customerPhoto: 'https://i.pravatar.cc/150?img=68',
    serviceType: 'Photography',
    packageName: 'Basic Photography Package',
    packagePrice: 55000,
    optionalItems: [],
    totalAmount: 55000,
    eventDate: '2026-03-18',
    eventDay: 'Wednesday',
    eventTime: '4:00 PM - 9:00 PM',
    guestCount: 200,
    status: 'pending',
    orderDate: '2026-02-13',
    specialRequests: 'Family portraits priority',
  },
  {
    id: 'ORD008',
    customerName: 'Mariam Butt',
    customerPhoto: 'https://i.pravatar.cc/150?img=20',
    serviceType: 'Parlor',
    packageName: 'Mehndi Special Package',
    packagePrice: 35000,
    optionalItems: [
      { name: 'Hair Styling', price: 10000 },
    ],
    totalAmount: 45000,
    eventDate: '2026-03-12',
    eventDay: 'Thursday',
    eventTime: '10:00 AM - 2:00 PM',
    guestCount: 1,
    status: 'accepted',
    orderDate: '2026-02-09',
    specialRequests: 'Traditional mehndi designs preferred',
  },
];

// Calculate statistics from orders
export const getOrderStats = () => {
  const totalOrders = mockOrders.length;
  const acceptedOrders = mockOrders.filter(order => order.status === 'accepted').length;
  const rejectedOrders = mockOrders.filter(order => order.status === 'rejected').length;
  const pendingOrders = mockOrders.filter(order => order.status === 'pending').length;
  
  const totalRevenue = mockOrders
    .filter(order => order.status === 'accepted')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return {
    totalOrders,
    acceptedOrders,
    rejectedOrders,
    pendingOrders,
    totalRevenue,
  };
};

// Get recent orders (limit to 3 for dashboard)
export const getRecentOrders = (limit = 3) => {
  return mockOrders
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    .slice(0, limit);
};

// Get orders by status
export const getOrdersByStatus = (status) => {
  if (!status) return mockOrders;
  return mockOrders.filter(order => order.status === status);
};

// Get order by ID
export const getOrderById = (orderId) => {
  return mockOrders.find(order => order.id === orderId);
};
