"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  name: string;
  band: number;
};

export function BandTrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis domain={[4, 9]} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="band" stroke="#d9277a" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
