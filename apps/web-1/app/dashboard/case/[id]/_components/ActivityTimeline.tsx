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
              <div className="space-y-1.5 font-body">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h4 className="font-heading font-bold text-xs text-text-app">
                    {label}
                  </h4>
                  <span className="text-[10px] text-text-subtle">
                    {formatDateTime(event.created_at)}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {desc}
                </p>
                {event.actor && (
                  <p className="text-[10px] text-text-subtle">
                    Thực hiện bởi: <strong className="text-text-muted">{event.actor.name}</strong> ({event.actor.role === "admin" ? "Admin" : event.actor.role === "supporter" ? "Supporter" : "Sinh viên"})
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
