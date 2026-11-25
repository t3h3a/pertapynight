import type { createElement, ReactElement } from 'react';
export function jordanToday(now?: Date): string;
export function validEvening(date: string, today?: string): boolean;
export function validCount(value: string): boolean;
type Party = { adults: string; children: boolean; childCount: string };
export function bookingPlan(render: typeof createElement, locale: string): {
  calendar(props: { monthOffset: number; setMonth: (v:number)=>void; date:string; select:(v:string)=>void }): ReactElement;
  party(props: Party & { setAdults:(v:string)=>void; setChildren:(v:boolean)=>void; setChildCount:(v:string)=>void; invalid:boolean }): ReactElement;
  summary(props: Party & { date:string }): ReactElement;
};
