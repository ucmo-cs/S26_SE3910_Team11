// appointmentData.ts — now backed by the Spring Boot API instead of Supabase.
import {
  fetchBookedSlots as apiFetchBookedSlots,
  bookAppointment as apiBookAppointment,
} from "@/lib/api";

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
  time: string;
  label: string;
}

export interface Appointment {
  id: string;
  topicId: number;
  branchId: number;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
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

export const getBookedSlots = async (branchId: number, date: string): Promise<string[]> => {
  return apiFetchBookedSlots(branchId, date);
};

export const isSlotBooked = async (branchId: number, date: string, time: string): Promise<boolean> => {
  const booked = await getBookedSlots(branchId, date);
  return booked.includes(time);
};

export const bookAppointment = async (
  appointment: Omit<Appointment, "id">,
  _topicName: string,
  _branchName: string,
  _branchAddress: string
): Promise<Appointment> => {
  const result = await apiBookAppointment({
    topicId: appointment.topicId,
    branchId: appointment.branchId,
    date: appointment.date,
    time: appointment.time,
    firstName: appointment.firstName,
    lastName: appointment.lastName,
    email: appointment.email,
    phone: appointment.phone,
  });
  return {
    id: result.id,
    topicId: result.topicId,
    branchId: result.branchId,
    date: result.date,
    time: result.time.slice(0, 5),
    firstName: result.firstName,
    lastName: result.lastName,
    email: result.email,
    phone: result.phone,
  };
};

export const getBranchesByTopic = (topicId: number): Branch[] => {
  return branches.filter((b) => b.supportedTopicIds.includes(topicId));
};
