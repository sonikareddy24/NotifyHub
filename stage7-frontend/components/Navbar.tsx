// components/Navbar.tsx
import * as React from "react";
import { AppBar, Toolbar, Typography, IconButton, Badge, Box } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StarIcon from "@mui/icons-material/Star";
import Link from "next/link";
import { useRouter } from "next/router";

type Props = { unreadCount: number };

export default function Navbar({ unreadCount }: Props) {
  const router = useRouter();
  const isHome = router.pathname === "/";
  const isPriority = router.pathname === "/priority";

  const linkStyle = (active: boolean) => ({
    color: active ? "#fff" : "#90caf9",
    textDecoration: "none",
    marginLeft: 16,
    display: "flex",
    alignItems: "center",
  });

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}
        >
          Campus Notification Platform
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box sx={linkStyle(isHome)}>
              <IconButton color="inherit">
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              <Typography variant="button" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                All
              </Typography>
            </Box>
          </Link>
          <Link href="/priority" style={{ textDecoration: 'none' }}>
            <Box sx={linkStyle(isPriority)}>
              <IconButton color="inherit">
                <StarIcon />
              </IconButton>
              <Typography variant="button" sx={{ ml: 0.5, display: { xs: 'none', sm: 'inline' } }}>
                Priority
              </Typography>
            </Box>
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
