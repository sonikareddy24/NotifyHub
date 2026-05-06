import * as React from "react";
import { Card, CardContent, Typography, Chip, Box, Avatar, alpha } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";

export type Notification = {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
  score?: number;
};

type Props = {
  notification: Notification;
  viewed: boolean;
};

export default function NotificationCard({ notification, viewed }: Props) {
  const { Message, Type, Timestamp, score } = notification;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "Placement": return { icon: <WorkIcon />, color: "#4f46e5", bg: "#e0e7ff" };
      case "Result": return { icon: <SchoolIcon />, color: "#10b981", bg: "#d1fae5" };
      case "Event": return { icon: <EventIcon />, color: "#f59e0b", bg: "#fef3c7" };
      default: return { icon: <EventIcon />, color: "#64748b", bg: "#f1f5f9" };
    }
  };

  const config = getTypeConfig(Type);

  return (
    <Card
      sx={{
        opacity: viewed ? 0.6 : 1,
        mb: 2,
        position: 'relative',
        borderRadius: 4,
        border: viewed ? '1px solid #e2e8f0' : '1px solid transparent',
        backgroundColor: viewed ? '#f8fafc' : '#ffffff',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          backgroundColor: viewed ? '#cbd5e1' : config.color,
          borderRadius: '4px 0 0 4px',
        }
      }}
      elevation={viewed ? 0 : 2}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, p: 3, '&:last-child': { pb: 3 } }}>
        <Avatar 
          sx={{ 
            bgcolor: viewed ? '#f1f5f9' : config.bg, 
            color: viewed ? '#64748b' : config.color, 
            width: 54, 
            height: 54,
            boxShadow: viewed ? 'none' : `0 4px 12px ${alpha(config.color, 0.2)}`
          }}
        >
          {config.icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="800" sx={{ color: viewed ? 'text.secondary' : 'text.primary', fontSize: '1.1rem' }}>
                {Type}
              </Typography>
              <Chip 
                label={new Date(Timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
                size="small" 
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(config.color, 0.05), color: config.color }} 
              />
            </Box>
            {score !== undefined && !viewed && (
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', bgcolor: alpha('#4f46e5', 0.1), px: 1, py: 0.5, borderRadius: 1.5 }}>
                SCORE: {score}
              </Typography>
            )}
          </Box>
          <Typography variant="body1" sx={{ color: viewed ? 'text.secondary' : '#334155', mb: 0, lineHeight: 1.6, fontWeight: 500 }}>
            {Message}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
