export interface Topic {
  id: number;
  name: string;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  supportedTopicIds: number[];
}

export interface TimeSlot {
  time: string; // "HH:mm"
  label: string; // "9:00 AM"
}

export interface Appointment {
  id: string;
  topicId: number;
  branchId: number;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  firstName: string;
  lastName: string;
  email: string;
}

export const topics: Topic[] = [
  { id: 1, name: "Open an account" },
  { id: 2, name: "Loan and mortgage consultation" },
  { id: 3, name: "Financial planning and wealth management" },
  { id: 4, name: "Other" },
];

export const branches: Branch[] = [
  {
    id: 1,
    name: "Southland Shopping Center",
    address: "1731 E Mechanic St",
    city: "Harrisonville",
    state: "MO",
    zip: "64701",
    supportedTopicIds: [1, 2, 4],
  },
  {
    id: 2,
    name: "Harrisonville Main Branch & ATM",
    address: "1301 Locust St",
    city: "Harrisonville",
    state: "MO",
    zip: "64701",
    supportedTopicIds: [1, 3, 4],
  },
];

export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      const h = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      const label = `${h}:${min.toString().padStart(2, "0")} ${ampm}`;
      slots.push({ time, label });
    }
  }
  return slots;
};

// In-memory store for booked appointments
let bookedAppointments: Appointment[] = [];

export const getBookedAppointments = () => bookedAppointments;

export const isSlotBooked = (branchId: number, date: string, time: string): boolean => {
  return bookedAppointments.some(
    (a) => a.branchId === branchId && a.date === date && a.time === time
  );
};

export const bookAppointment = (appointment: Omit<Appointment, "id">): Appointment => {
  const newAppointment: Appointment = {
    ...appointment,
    id: crypto.randomUUID(),
  };
  bookedAppointments = [...bookedAppointments, newAppointment];
  return newAppointment;
};

export const getBranchesByTopic = (topicId: number): Branch[] => {
  return branches.filter((b) => b.supportedTopicIds.includes(topicId));
};
