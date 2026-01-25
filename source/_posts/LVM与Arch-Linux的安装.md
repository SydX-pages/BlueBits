---
title: LVM与Arch Linux的安装
date: 2026-01-25 23:41:03
tags:
  - archlinux
  - dual-boot
  - lvm
  - btrfs
  - ext4
  - chroot
categories:
  - [Docs, Dev]
---

<div style="text-align:right; color:#b3c5d8 !important;">
  <em style="color:#b3c5d8: !important;"> —— 
        本文记录一次安装Arch Linux的详细过程，使用LVM处理分区，/使用btrfs
    </em>
</div>
<div style="clear:both;"></div>
<!--more-->

# 安装前准备

- 电脑使用ThinkPad x1 carbon 5th
- U盘准备arch的iso镜像（使用ventoy）
- [Ventoy](https://www.ventoy.net/en/download.html)
- [Arch.iso](https://mirrors.ustc.edu.cn/archlinux/iso/2026.01.01/)
- [Arch Installation Guide](https://wiki.archlinux.org/title/Installation_guide)
- Ventoy的准备和修改启动项选择U盘启动不多赘述

# 安装

## 联网

```sh
iwctl station wlan0 connect <WIFI-ssid>
#然后输入密码

#查看网卡信息
ip a

#测试是否联通
ping 1.1.1.1
```

## 硬盘分区

使用熟悉的工具即可，博主小白一个，用fdisk

```sh
# 查看分区信息
fdisk -l
```

记住主硬盘叫什么（/dev/sda、/dev/nvme0n1）

```sh
# 使用fdisk分区

fdisk /dev/nvme0n1

# 创建分区
n
# 选择分区编号，直接回车
# 起始位置，直接回车

# 终点位置，输入+xG/+xM表示这块分区的大小
# 这里第一块分区用于/boot
+512M

```

输入n选择新建分区后会提示输入分区编号Partition Number，默认为已有的编号后一个，直接回车即可。
随后选择起始位置，回车。
最后是大小，这里第一块作为/boot，输入+512M然后回车。

```sh
# 选择分区类型
t
# 设置为EFI System
1
```

这块分区会挂载到/boot上，这里标记为EFI System。具体的编号在fdisk选择t之后输入L可以查看所有类型对应的编号。

到此就新建好了一块分区。（/dev/nvme0n1p5）

如法炮制接下来的LVM主分区

```sh
n
# 两次回车
# 大小直接回车全用上或者自行决定多大的分区
+xG

t
# LVM分区的编号是44
44
```

完成分区后可以输入p查看分区表，示例如下

示例非本次安装过程中的分区表，仅供参考

```sh
Device             Start       End   Sectors   Size Type
/dev/nvme0n1p1      2048    206847    204800   100M EFI System
/dev/nvme0n1p2    206848    239615     32768    16M Microsoft reserved
/dev/nvme0n1p3    239616 208320511 208080896  99.2G Microsoft basic data
/dev/nvme0n1p4 208320512 209952767   1632256   797M Windows recovery environment
/dev/nvme0n1p5 209952768 211001343   1048576   512M EFI System
/dev/nvme0n1p6 211001344 478150655 267149312 127.4G Linux LVM
/dev/nvme0n1p7 478150656 500117503  21966848  10.5G Microsoft basic data
```

最终输入w写入分区，推出fdisk。此时可以fdisk -l再次确认

## 管理LVM

/dev/nvme0n1p6作为LVM的主分区，目标是将这块分区新建一个Physical Volume，加入一个Volume Group，在这个Volume Group中创建多个Logical Volume。

```sh
# 新建pv
pvcreate /dev/nvme0n1p6

# 加入vg
vgcreate vg0 /dev/nvme0n1p6

# 创建lv
lvcreate -L 20G vg0 -n arch_root
lvcreate -L 20G vg0 -n arch_home
lvcreate -L 4G vg0 -n swap

```

创建完成后可以查看pv、vg、lv的情况

```sh
pvs
  PV             VG  Fmt  Attr PSize   PFree
  /dev/nvme0n1p6 vg0 lvm2 a--  127.38g 63.38g

vgs
  VG  #PV #LV #SN Attr    VSize   VFree
  vg0   1   3   0 wz--n-- 127.38g 63.38g

lvs
  LV        VG  Attr       LSize  Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  arch_home vg0 -wi-ao---- 20.00g
  arch_root vg0 -wi-ao---- 20.00g
  swap      vg0 -wi-ao----  4.00g

```

## 格式化分区

先看目前的分区情况（根据您的实际情况），在此只罗列有需要的分区

/dev/nvme0n1p1：windows的启动分区，dual-boot需要
/dev/nvme0n1p5：准备挂载到/boot的分区，用于存放内核文件
/dev/nvme0n1p6：LVM，具体如下
/dev/vg0/arch_root：挂载到/，根分区
/dev/vg0/arch_home：挂载到/home，家分区
/dev/vg0/swap：swap分区，这里设置为和内存的一半。见过多种说法，内存一半、内存一样和内存两倍，不清楚哪种好。

接下来格式化分区

```sh
# /boot为fat32或者vfat
mkfs.fat -F32 /dev/nvme0n1p5

# /格式化为btrfs
mkfs.btrfs /dev/vg0/arch_root

# /home格式化为常见的ext4（博主小白比较保守）
mkfs.ext4 /dev/vg0/arch_home

# swap分区
mkswap /dev/vg0/swap

```

## 挂载分区

### 挂载根分区

因为是btrfs，不能直接挂载，主要步骤是：

1. 挂载，创建子卷subvolume
2. 取消挂载
3. 重新挂载子卷

```sh
# 先挂载
mount /dev/vg0/arch_root /mnt

# 创建btrfs子卷
btrfs su cr /mnt/{@,@log,@.snapshot}

# 取消挂载
umount /mnt

# 重新挂载子卷
mount -o subvol=@,compress=zstd /dev/vg0/arch_root /mnt

# 创建挂载点
mkdir -p /mnt/{home,boot,var/log,.snapshots}

# 挂载其他子卷
mount -o subvol=@log,compress=zstd /dev/vg0/arch_root /mnt/var/log
mount -o subvol=@snapshot,compress=zstd /dev/vg0/arch_root /mnt/.snapshots
```

几个解释：

- su即subvolume
- cr即create
- compress设置压缩方式

### 挂载其他分区

```sh
# 挂载家分区
mount /dev/vg0/arch_home /mnt/home

# 挂载启动分区
mount /dev/nvme0n1p5 /mnt/boot
```

这里先不处理windows的启动分区，最后再说

## 安装Arch Linux

### 先换镜像源

这里改成[ustc源](https://mirrors.ustc.edu.cn/help/archlinux.html)

```sh
vim /etc/pacman.d/mirrorlist
# 加入以下内容在文件最前
Server = https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch
```

### pacstrap安装

```sh
# 更新key
pacstrap -Sy archlinux-keyring

# pacstrap安装系统
pacstrap /mnt base linux linux-firmware base-devel btrfs-progs nvim os-prober grub lvm2 efibootmgr
```

## chroot配置grub

arch-chroot进入/mnt挂载的arch系统

```sh
arch-chroot /mnt
```

安装grub

```sh
grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=TPx1C
```

启用os-prober和lvm

```sh
nvim /etc/mkinitcpio.conf
# 加入或修改这样一行
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block lvm2 filesystems fsck)

nvim /etc/default/grub
# 将GRUB_DISABLE_OS_PROBER=false取消注释
GRUB_DISABLE_OS_PROBER=false
```

准备dual-boot，将windows的启动分区挂载到/boot/efi

```sh
mount /dev/nvme0n1p1 /boot/efi
```

重新生成grub配置

```sh
mkinitcpio -P
grub-mkconfig -o /boot/grub/grub.cfg
```

应该看到输出中有类似windows boot manager的内容

## 生成fstab

退出到live arch中

```sh
genfstab -U /mnt > /mnt/etc/fstab
```

## 其他系统内基础设置

### 设置时区

```sh
ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

### 设置主机名

```sh
nvim /etc/hostname
#写入主机名
```

### 设置root密码、新建用户

```sh
passwd
# 输入密码

# 新建用户
useradd -m -G wheel -s /bin/bash <username>
passwd <username>
# 输入密码

# sudoers NOPASSWD
EDITOR=nvim visudo
# 取消以下一行内容的注释，sudo的时候不用反复输密码
%wheel ALL=(ALL:ALL) NOPASSWD: ALL
```

### 语言设置

```sh
nvim locale.gen
# 取消注释需要的，如en_US.UTF-8
nvim locale.conf

# 输入以下内容
LANG=en_US.UTF-8
# 或者你需要的
```

### 调整时间

```sh
hwclock --systohc
timedatectl set-ntp true
timedatectl set-local-rtc 1    #为了处理双系统下的时间不同步问题
```

### 安装一些其他的东西

```sh
pacman -S fastfetch ranger htop fzf zsh networkwanager git curl wget
```

# 安装完成

现在可以重启进入arch linux输入去装桌面了。
可以参考我的[dotfiles](https://github.com/SydX-pages/BlueBits)
