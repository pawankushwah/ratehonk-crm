import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import type { WhatsappDevice } from "@shared/schema";

export default function WhatsAppDeviceConnect() {
  const [match, params] = useRoute("/whatsapp-devices/:id/connect");
  const [, setLocation] = useLocation();
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const deviceId = params?.id ? parseInt(params.id) : null;

  // Fetch device details
  const { data: device } = useQuery<WhatsappDevice>({
    queryKey: ["/api/whatsapp-devices", deviceId],
    enabled: !!deviceId,
  });

  // Simulate connection status updates
  useEffect(() => {
    if (device?.status === "scanning") {
      const logs = [
        `${new Date().toLocaleTimeString()} - Waiting for login...`,
        `${new Date().toLocaleTimeString()} - Start Connection.`,
        `${new Date().toLocaleTimeString()} - QR Code received.`,
      ];
      setConnectionLogs(logs);
    }
  }, [device]);

  if (!match || !deviceId || !device) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <p className="text-gray-500">Device not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-700">
              Whatsapp Account {device.number}
            </h1>
            <Badge variant={device.status === "connected" ? "default" : "destructive"}>
              {device.status === "connected" ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Info Banner */}
        {device.status !== "connected" && (
          <div className="mb-6 bg-cyan-50 border border-cyan-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-cyan-600 mt-0.5" />
            <p className="text-sm text-cyan-800">
              Don't leave your phone before connected
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
                {device.qrCode ? (
                  <img
                    src={device.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                    data-testid="img-qr-code"
                  />
                ) : (
                  <div className="w-64 h-64 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-2">📱</div>
                      <p className="text-sm">QR Code will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Button */}
              <Button
                className="w-full bg-orange-400 hover:bg-orange-500 text-white"
                disabled={device.status === "connected"}
                data-testid="button-scan-qr"
              >
                Scan this QR code with your WhatsApp
              </Button>

              {/* Connection Logs */}
              {connectionLogs.length > 0 && (
                <div className="bg-gray-100 rounded-lg p-4 space-y-1">
                  {connectionLogs.map((log, index) => (
                    <p key={index} className="text-xs text-gray-600 font-mono">
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Whatsapp Info</CardTitle>
              {device.lastConnectedAt && (
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                  Updated{" "}
                  {new Date(device.lastConnectedAt).toLocaleString("en-US", {
                    minute: "numeric",
                    hour: "numeric",
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400">👤</span>
                  <span className="font-medium">Name:</span>
                </div>
                <span className="text-sm text-gray-900">
                  {device.deviceName || "-"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400">📱</span>
                  <span className="font-medium">Number:</span>
                </div>
                <span className="text-sm text-gray-900">{device.number}</span>
              </div>

              {device.status === "connected" && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="text-xl">✓</span>
                    <div>
                      <p className="font-medium">Connected Successfully</p>
                      <p className="text-sm">Your WhatsApp device is ready to send messages</p>
                    </div>
                  </div>
                </div>
              )}

              {device.status === "disconnected" && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-gray-600">
                    <p className="font-medium mb-2">How to connect:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>Open WhatsApp on your phone</li>
                      <li>Tap Menu or Settings</li>
                      <li>Tap Linked Devices</li>
                      <li>Tap "Link a Device"</li>
                      <li>Scan the QR code on the left</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation("/whatsapp-devices")}
            data-testid="button-back"
          >
            Back to Devices
          </Button>
        </div>
      </div>
    </Layout>
  );
}
