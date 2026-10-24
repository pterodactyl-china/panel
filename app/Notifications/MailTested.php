<?php

declare(strict_types=1);

namespace Pterodactyl\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Pterodactyl\Models\User;

class MailTested extends Notification
{
    public function __construct(private readonly User $user) {}

    /**
     * @return list<string>
     */
    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        return (new MailMessage)
            ->subject('Pterodactyl 测试邮件')
            ->greeting('您好，'.$this->user->name.'!')
            ->line('这是 Pterodactyl 邮件系统的测试邮件，一切正常！');
    }
}
