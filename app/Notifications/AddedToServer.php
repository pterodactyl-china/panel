<?php

declare(strict_types=1);

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AddedToServer extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @param  array{user: string, name: string, uuidShort: string}  $server
     */
    public function __construct(
        public readonly array $server,
    ) {
        $this->afterCommit();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return list<string>
     */
    public function via(): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(): MailMessage
    {
        return (new MailMessage)
            ->greeting('您好，'.$this->server['user'].'!')
            ->line('您已被添加为以下服务器的子用户，可以对该服务器进行一定程度的操作。')
            ->line('服务器名称：'.$this->server['name'])
            ->action('访问服务器', url('/server/'.$this->server['uuidShort']));
    }
}
