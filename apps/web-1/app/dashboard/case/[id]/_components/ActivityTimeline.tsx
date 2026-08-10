"use client";

import React from "react";
import { Case } from "@/types";
import { Clock } from "lucide-react";
import { getEventDetails } from "@/lib/event-details";

interface ActivityTimelineProps {
  caseData: Case;
}

export default function ActivityTimeline({ caseData }: ActivityTimelineProps) {
  const events = caseData.events || [];

  // Filter out message_sent events to avoid cluttering the timeline with chat messages
  const filteredEvents = events.filter(event => event.event_type !== "message_sent");

  // Sort events chronologically (oldest first)
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " ngày " + d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="bg-surface-app border border-border-app rounded-lg p-8 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
        <Clock className="w-8 h-8 text-text-subtle animate-pulse" />
        <p className="text-xs text-text-muted font-body">Chưa có hoạt động nào được ghi nhận cho hồ sơ này.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-app border border-border-app rounded-lg p-6 md:p-8 space-y-6 animate-fade-in">
      <div className="relative pl-6 border-l-2 border-border-app space-y-8 py-2 ml-4">
        {sortedEvents.map((event) => {
          const { label, desc, icon: Icon, colorClass } = getEventDetails(event.event_type);

          return (
            <div key={event.id} className="relative group">
              {/* Timeline Marker Point */}
              <div className={`absolute -left-[38px] top-0 w-8 h-8 rounded-full flex items-center justify-center border ${colorClass} shadow-sm transition-transform group-hover:scale-110 z-10 bg-surface-app`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Event Content card */}
              <div className="space-y-1 font-body">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-heading font-bold text-base text-text-app tracking-tight">
                    {label}
                  </h4>
                  <span className="text-xs text-text-subtle font-mono bg-surface-soft px-2 py-0.5 rounded border border-border-app/40 shrink-0">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>

                <p className="text-base text-text-muted leading-relaxed font-normal pt-0.5">
                  {desc}
                  {(event.event_type === "case_rejected" || event.event_type === "vetoed") &&
                    (event.metadata_json as any)?.reason && (
                      <span className="text-danger font-medium"> — Lý do: {(event.metadata_json as any).reason}</span>
                    )}
                </p>

                {event.actor && (
                  <div className="pt-1 flex items-center gap-1.5 text-sm text-text-subtle">
                    <span>Thực hiện bởi:</span>
                    <span className="font-semibold text-text-app bg-surface-soft px-2 py-0.5 rounded border border-border-app/60 inline-flex items-center gap-1 text-sm">
                      {event.actor.name}
                      <span className="text-text-subtle font-normal text-xs">({event.actor.role === "admin" ? "Admin" : event.actor.role === "supporter" ? "Supporter" : "Sinh viên"})</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
