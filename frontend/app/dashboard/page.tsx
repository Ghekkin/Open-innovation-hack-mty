"use client";
import { Box, Paper, Typography } from "@mui/material";

export default function Dashboard() {
  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
      <Typography
        variant="h4"
        sx={{ color: "#FF0000", fontWeight: "bold", mb: 4 }}
      >
        Welcome to your Dashboard
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          alignItems: "stretch",
        }}
      >
        <Paper
          sx={{
            flex: 1,
            p: 3,
            bgcolor: "#fff",
            borderRadius: 2,
            border: "2px solid #FF0000",
            mb: { xs: 3, md: 0 },
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#FF0000", fontWeight: "bold" }}
            gutterBottom
          >
            Section 1
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is a sample section of your dashboard. You can add any content
            here.
          </Typography>
        </Paper>
        <Paper
          sx={{
            flex: 1,
            p: 3,
            bgcolor: "#fff",
            borderRadius: 2,
            border: "2px solid #FF0000",
            mb: { xs: 3, md: 0 },
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#FF0000", fontWeight: "bold" }}
            gutterBottom
          >
            Section 2
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Another section with different content. Add charts, tables, or any
            other components.
          </Typography>
        </Paper>
        <Paper
          sx={{
            flex: 1,
            p: 3,
            bgcolor: "#fff",
            borderRadius: 2,
            border: "2px solid #FF0000",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#FF0000", fontWeight: "bold" }}
            gutterBottom
          >
            Section 3
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A third section for additional content or features.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}