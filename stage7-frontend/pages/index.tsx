// pages/index.tsx
import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Alert,
  Skeleton,
  Typography,
  Badge,
  Container,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckAllIcon from "@mui/icons-material/DoneAll";
import Navbar from "../components/Navbar";
import NotificationCard from "../components/NotificationCard";
import FilterBar from "../components/FilterBar";
import useNotifications from "../hooks/useNotifications";
import logger from "../lib/logger";

export default function Home() {
  const {
    notifications,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    viewedIds,
    markAllViewed,
    notificationType,
    setNotificationType,
    unreadCount,
  } = useNotifications();

  React.useEffect(() => {
    logger.info("Home page mounted");
  }, []);

  return (
    <>
      <Navbar unreadCount={unreadCount} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
              Campus Feed
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Stay updated with the latest placements, results, and events.
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
              {unreadCount}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Unread Alerts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
          <FilterBar type={notificationType} setType={setNotificationType} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button 
                variant="soft" 
                startIcon={<CheckAllIcon />} 
                onClick={markAllViewed}
                sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'primary.dark',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              >
                Mark all read
              </Button>
            )}
            <IconButton onClick={refresh} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ mb: 2, borderRadius: 2 }} />
          ))}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} action={<Button onClick={refresh}>Retry</Button>}>
            Failed to load notifications. Please check your connection.
          </Alert>
        )}

        {!loading && notifications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No notifications found in this category.</Typography>
            <Button onClick={refresh} variant="outlined" sx={{ mt: 2 }}>Refresh Feed</Button>
          </Box>
        )}

        <List disablePadding>
          {notifications.map((n: any) => (
            <ListItem key={n.ID} disableGutters sx={{ mb: 0 }}>
              <Box sx={{ width: '100%' }}>
                <NotificationCard notification={n} viewed={viewedIds.has(n.ID)} />
              </Box>
            </ListItem>
          ))}
        </List>

        {hasMore && notifications.length > 0 && (
          <Box textAlign="center" mt={4}>
            <Button 
              onClick={loadMore} 
              disabled={loading}
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 3 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Load older notifications"}
            </Button>
          </Box>
        )}
      </Container>
    </>
  );
}
