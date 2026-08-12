import { z } from "zod";
import { isValidBrazilianDocument, onlyDigits } from "./documents";

export const passwordSchema = z.string()
  .min(8, "Use pelo menos 8 caracteres.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/\d/, "Inclua um número.")
  .regex(/[^A-Za-z0-9]/, "Inclua um caractere especial.");

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
  captchaToken: z.string().optional(),
});

export const signupSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo."),
  empresa: z.string().trim().min(2, "Informe o nome da empresa."),
  cpfCnpj: z.string().refine(isValidBrazilianDocument, "CPF ou CNPJ inválido."),
  telefone: z.string().refine((value) => [10, 11].includes(onlyDigits(value).length), "Telefone inválido."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: passwordSchema,
  confirmPassword: z.string(),
  captchaToken: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.", path: ["confirmPassword"],
});

export const profileSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo."),
  empresa: z.string().trim().min(2, "Informe o nome da empresa."),
  cpfCnpj: z.string().refine(isValidBrazilianDocument, "CPF ou CNPJ inválido."),
  telefone: z.string().refine((value) => [10, 11].includes(onlyDigits(value).length), "Telefone inválido."),
});
