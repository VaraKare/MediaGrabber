
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Download } from "lucide-react";

interface RecentDownloadsProps {
  downloads: any[];
}

export function RecentDownloads({ downloads }: RecentDownloadsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Downloads</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {downloads.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.title}</TableCell>
                <TableCell>{d.platform}</TableCell>
                <TableCell>{d.format}</TableCell>
                <TableCell><Badge>{d.status}</Badge></TableCell>
                <TableCell>
                  {d.status === 'completed' && (
                    <a href={`/api/downloads/${d.id}/file`} download>
                      <Download className="h-5 w-5" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
