// pages/priority.tsx
import * as React from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  Skeleton,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Container,
  Paper
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Navbar from "../components/Navbar";
import NotificationCard from "../components/NotificationCard";
import usePriority from "../hooks/usePriority";
import useNotifications from "../hooks/useNotifications";
import logger from "../lib/logger";

export default function PriorityPage() {
  const { unreadCount } = useNotifications();
  const { notifications, loading, n, setN, refresh } = usePriority(10);

  React.useEffect(() => {
    logger.info("Priority page mounted");
  }, []);

  const handleNChange = (_: React.MouseEvent<HTMLElement>, newN: number) => {
    if (newN !== null) setN(newN);
  };

  return (
    <>
      <Navbar unreadCount={unreadCount} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
            mb: 4,
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="800" sx={{ mb: 1, letterSpacing: '-0.03em' }}>
                Priority Inbox
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                The most critical alerts ranked by our priority algorithm.
              </Typography>
            </Box>
            <IconButton onClick={refresh} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <Box display="flex" alignItems="center" gap={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Show top:</Typography>
            <ToggleButtonGroup
              value={n}
              exclusive
              onChange={handleNChange}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiToggleButton-root': { 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.2)',
                  px: 2,
                  '&.Mui-selected': { bgcolor: 'white', color: '#4f46e5', '&:hover': { bgcolor: '#f1f5f9' } }
                } 
              }}
            >
              <ToggleButton value={10}>10</ToggleButton>
              <ToggleButton value={15}>15</ToggleButton>
              <ToggleButton value={20}>20</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 2 }} />
          ))
        ) : notifications.length > 0 ? (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <ListItem key={notification.ID} disableGutters sx={{ mb: 2, display: 'block' }}>
                <Box display="flex" alignItems="center" mb={1} sx={{ px: 1 }}>
                  <Box 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: 1.5, 
                      bgcolor: '#4f46e5', 
                      color: 'white', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      mr: 1.5,
                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Priority Rank
                  </Typography>
                </Box>
                <NotificationCard notification={notification} viewed={false} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={10}>
            <Typography color="text.secondary">No priority notifications found.</Typography>
            <Button onClick={refresh} sx={{ mt: 2 }}>Retry</Button>
          </Box>
        )}
      </Container>
    </>
  );
}
