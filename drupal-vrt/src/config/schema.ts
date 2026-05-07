// #ddev-generated
import { z } from 'zod';

export const ViewportName = z.enum(['narrow', 'mid', 'wide']);
export type ViewportName = z.infer<typeof ViewportName>;

export const Direction = z.enum(['ltr', 'rtl']);
export type Direction = z.infer<typeof Direction>;

const ClickArg = z.union([
  z.string(),
  z
    .object({
      selector: z.string(),
      button: z.enum(['left', 'right', 'middle']).optional(),
      count: z.number().int().positive().optional(),
    })
    .strict(),
]);

const FillArg = z
  .object({ selector: z.string(), value: z.string() })
  .strict();

const PressArg = z
  .object({ selector: z.string().optional(), key: z.string() })
  .strict();

const HoverArg = z.string();

const SelectArg = z
  .object({ selector: z.string(), value: z.string() })
  .strict();

const CheckArg = z.string();
const UncheckArg = z.string();

const WaitForArg = z.union([
  z.string(),
  z
    .object({
      selector: z.string(),
      state: z.enum(['visible', 'hidden', 'attached', 'detached']).optional(),
    })
    .strict(),
]);

const ScrollArg = z.union([
  z.object({ selector: z.string() }).strict(),
  z.object({ x: z.number(), y: z.number() }).strict(),
]);

export const Step = z
  .object({
    click: ClickArg.optional(),
    fill: FillArg.optional(),
    press: PressArg.optional(),
    hover: HoverArg.optional(),
    select: SelectArg.optional(),
    check: CheckArg.optional(),
    uncheck: UncheckArg.optional(),
    waitFor: WaitForArg.optional(),
    scroll: ScrollArg.optional(),
  })
  .strict()
  .refine(
    (s) => Object.values(s).filter((v) => v !== undefined).length === 1,
    {
      message:
        'each step must have exactly one primitive (click, fill, press, hover, select, check, uncheck, waitFor, or scroll)',
    },
  );
export type Step = z.infer<typeof Step>;

export const Interaction = z
  .object({
    label: z.string().min(1),
    steps: z.array(Step).min(1),
  })
  .strict();
export type Interaction = z.infer<typeof Interaction>;

const Defaults = z
  .object({
    auth: z.string().min(1).optional(),
    viewports: z.array(ViewportName).min(1).optional(),
    directions: z.array(Direction).min(1).optional(),
    fullPage: z.boolean().optional(),
    timeout: z.number().int().positive().optional(),
    maskSelectors: z.array(z.string()).optional(),
    css: z.string().optional(),
  })
  .strict();
export type Defaults = z.infer<typeof Defaults>;

export const PageInput = z
  .object({
    id: z.string().min(1),
    path: z.string().min(1),
    auth: z.string().min(1).optional(),
    viewports: z.array(ViewportName).min(1).optional(),
    directions: z.array(Direction).min(1).optional(),
    fullPage: z.boolean().optional(),
    timeout: z.number().int().positive().optional(),
    testTimeout: z.number().int().positive().optional(),
    waitFor: z.string().optional(),
    maskSelectors: z.array(z.string()).optional(),
    css: z.string().optional(),
    skipIfStatus: z
      .union([z.number().int(), z.array(z.number().int()).min(1)])
      .optional(),
    interactions: z.array(Interaction).optional(),
  })
  .strict();
export type PageInput = z.infer<typeof PageInput>;

export const Mode = z
  .object({
    viewports: z.array(ViewportName).min(1),
    directions: z.array(Direction).min(1),
  })
  .strict();
export type Mode = z.infer<typeof Mode>;

export const User = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();
export type User = z.infer<typeof User>;

export const VrtConfigInput = z
  .object({
    version: z.literal(1),
    defaults: Defaults.optional(),
    bail: z.union([z.number().int().min(0), z.boolean()]).optional(),
    modes: z.record(z.any()).optional(),
    users: z.record(User).optional(),
    pages: z.array(PageInput).min(1),
  })
  .strict();
export type VrtConfigInput = z.infer<typeof VrtConfigInput>;

export interface ResolvedPage {
  id: string;
  path: string;
  auth: string;
  viewports: ViewportName[];
  directions: Direction[];
  fullPage: boolean;
  timeout: number;
  testTimeout?: number;
  waitFor?: string;
  maskSelectors: string[];
  css?: string;
  skipIfStatus?: number | number[];
  interactions?: Interaction[];
}

export interface VrtConfig {
  version: 1;
  bail: number | false;
  modes: Record<string, Mode>;
  defaultMode: string;
  users: Record<string, User>;
  pages: ResolvedPage[];
}
