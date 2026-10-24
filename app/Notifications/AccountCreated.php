<?php

declare(strict_types=1);

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Pterodactyl\Models\User;

class AccountCreated extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public User $user, public ?string $token = null)
    {
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
        $message = (new MailMessage)
            ->greeting('您好，'.$this->user->name.'!')
            ->line('收到这封邮件是因为有人在 '.config()->string('app.name').'.')
            ->line('用户名：'.$this->user->username)
            ->line('电子邮箱：'.$this->user->email);

        if (($this->token) !== null) {
            return $message->action('设置您的账户', url('/auth/password/reset/'.$this->token.'?email='.urlencode($this->user->email)));
        }

        return $message;
    }
}
