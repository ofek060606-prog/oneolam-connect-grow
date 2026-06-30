import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Authenticate the caller before using service-role privileges.
        // This function is invoked by the entity automation on Answer create,
        // so the caller must be the authenticated user who authored the answer.
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();

        const answer = payload.data;
        if (!answer) {
            return Response.json({ error: 'No answer data provided' }, { status: 400 });
        }

        // Verify the caller is the author of the answer being reported,
        // preventing spoofed notifications for arbitrary question/answer pairs.
        if (answer.created_by !== user.email) {
            return Response.json({ error: 'Forbidden: caller does not own this answer' }, { status: 403 });
        }

        const question = await base44.asServiceRole.entities.Question.get(answer.question_id);
        if (!question) {
            return Response.json({ error: 'Question not found' }, { status: 404 });
        }

        // Don't notify if the answerer is the question author
        if (answer.created_by === question.created_by) {
            return Response.json({ message: 'Author answered their own question, skipping notification' });
        }

        await base44.asServiceRole.entities.Notification.create({
            recipient_email: question.created_by,
            sender_email: answer.created_by,
            sender_name: answer.author_name,
            type: 'comment',
            content: `${answer.author_name} answered your question: "${question.title}"`,
            post_id: question.id,
            is_read: false,
        });

        return Response.json({ success: true, message: 'Notification sent to question author' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});