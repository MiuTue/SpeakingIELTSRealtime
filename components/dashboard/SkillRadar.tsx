"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

type SkillPoint = {
  skill: string;
  band: number;
};

export function SkillRadar({ data }: { data: SkillPoint[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <Radar dataKey="band" fill="#0e9488" fillOpacity={0.25} stroke="#0e9488" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
