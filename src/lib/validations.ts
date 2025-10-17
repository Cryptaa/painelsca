import { z } from 'zod';

// Authentication validation
export const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Formato de email inválido" }).max(255, { message: "Email deve ter no máximo 255 caracteres" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }).max(100, { message: "A senha deve ter no máximo 100 caracteres" }),
  full_name: z.string().trim().max(100, { message: "Nome deve ter no máximo 100 caracteres" }).optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{0,14}$/, { message: "Formato de telefone inválido" }).optional().or(z.literal('')),
});

export const signInSchema = z.object({
  email: z.string().trim().email({ message: "Formato de email inválido" }).max(255),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

// Project validation
export const projectSchema = z.object({
  name: z.string().trim().min(1, { message: "Nome do projeto é obrigatório" }).max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  description: z.string().max(1000, { message: "Descrição deve ter no máximo 1000 caracteres" }).optional(),
});

// Financial validation
export const investmentSchema = z.object({
  project_id: z.string().uuid({ message: "Projeto inválido" }),
  amount: z.number({ invalid_type_error: "Valor deve ser um número" }).positive({ message: "Valor deve ser maior que zero" }).max(999999999.99, { message: "Valor muito alto" }),
  date: z.date({ invalid_type_error: "Data inválida" }),
});

export const revenueSchema = z.object({
  project_id: z.string().uuid({ message: "Projeto inválido" }),
  gross_amount: z.number({ invalid_type_error: "Valor deve ser um número" }).positive({ message: "Valor deve ser maior que zero" }).max(999999999.99, { message: "Valor muito alto" }),
  gateway_percentage: z.number({ invalid_type_error: "Percentual deve ser um número" }).min(0, { message: "Percentual não pode ser negativo" }).max(100, { message: "Percentual não pode ser maior que 100" }),
  gateway_fixed_fee: z.number({ invalid_type_error: "Taxa deve ser um número" }).min(0, { message: "Taxa não pode ser negativa" }).max(999999.99, { message: "Taxa muito alta" }),
  date: z.date({ invalid_type_error: "Data inválida" }),
});

// Content validation
export const ideaSchema = z.object({
  title: z.string().trim().min(1, { message: "Título é obrigatório" }).max(200, { message: "Título deve ter no máximo 200 caracteres" }),
  description: z.string().max(5000, { message: "Descrição deve ter no máximo 5000 caracteres" }).optional(),
  category: z.string().max(100).optional(),
  project_type: z.string().max(100).optional(),
  brainstorm: z.string().max(10000).optional(),
  main_goal: z.string().max(1000).optional(),
  target_audience: z.string().max(1000).optional(),
  estimated_time: z.string().max(100).optional(),
  main_risk: z.string().max(1000).optional(),
  main_difficulty: z.string().max(1000).optional(),
  personal_motivation: z.string().max(2000).optional(),
  notes: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(20, { message: "Máximo de 20 tags" }).optional(),
  required_resources: z.array(z.string().max(200)).max(50, { message: "Máximo de 50 recursos" }).optional(),
});

export const learningSchema = z.object({
  title: z.string().trim().min(1, { message: "Título é obrigatório" }).max(200, { message: "Título deve ter no máximo 200 caracteres" }),
  description: z.string().max(10000, { message: "Descrição deve ter no máximo 10000 caracteres" }),
  tags: z.array(z.string().max(50)).max(20, { message: "Máximo de 20 tags" }).optional(),
});

export const personalNoteSchema = z.object({
  title: z.string().trim().min(1, { message: "Título é obrigatório" }).max(200, { message: "Título deve ter no máximo 200 caracteres" }),
  content: z.string().max(50000, { message: "Conteúdo deve ter no máximo 50000 caracteres" }),
  tags: z.array(z.string().max(50)).max(20, { message: "Máximo de 20 tags" }).optional(),
});

// Admin validation
export const subscriptionSchema = z.object({
  user_id: z.string().uuid({ message: "Usuário inválido" }),
  plan_name: z.string().trim().min(1, { message: "Nome do plano é obrigatório" }).max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  price: z.number({ invalid_type_error: "Preço deve ser um número" }).nonnegative({ message: "Preço não pode ser negativo" }).max(999999.99, { message: "Preço muito alto" }).optional(),
  notes: z.string().max(1000, { message: "Notas devem ter no máximo 1000 caracteres" }).optional(),
  start_date: z.date({ invalid_type_error: "Data inválida" }),
  end_date: z.date({ invalid_type_error: "Data inválida" }).optional(),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().trim().max(100, { message: "Nome deve ter no máximo 100 caracteres" }).optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{0,14}$/, { message: "Formato de telefone inválido" }).optional().or(z.literal('')),
  email: z.string().trim().email({ message: "Formato de email inválido" }).max(255, { message: "Email deve ter no máximo 255 caracteres" }),
});
