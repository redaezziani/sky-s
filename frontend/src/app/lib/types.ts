export interface Dom {
  id: number
  name: string
  address: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  dom: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export interface Role {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface GameType {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface MachineType {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Machine {
  id: number
  name: string
  machineTypeId?: number
  domeId?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Optional populated relationships
  machineType?: MachineType
  dom?: Dom
}

export interface Game {
  id: number
  name: string
  price: number
  playTime: number
  gameTypeId?: number
  machineTypeId?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Optional populated relationships
  gameType?: GameType
  machineType?: MachineType
}

export interface Experience {
  id: number
  machineId: number
  gameId: number
  domeId: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Optional populated relationships
  machine?: Machine
  game?: Game
  dom?: Dom
}
export interface Ticket {
  id: number
  experienceId: number
  isPaid: boolean
  chairId?: number
  domeId: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Optional populated relationships
  chair?: MachineChair
  dom?: Dom
}

export interface MachineChair {
  id: number
  name: string
  machineId: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Optional populated relationships
  machine?: Machine
}

// user types


export interface User {
  id: number
  name: string
  email: string
  role: string
  dom: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export interface CreateUser {
  name: string
  email: string
  password: string
  role: string
  dom: string
}

export interface EditUser {
  id: number
  name: string
  email: string
  password: string
  role: string
  dom: string
}