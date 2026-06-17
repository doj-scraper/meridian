


This is a rich, detailed set of notes on agentic AI systems and post-training methodologies. Here is a comprehensive synthesis of the key concepts covered across your sources:

***

## Overview: From Chatbots to Agents

The AI landscape has fundamentally shifted from simple chatbots to **sophisticated agentic systems** capable of using tools, executing multi-step plans, and collaborating with other specialized agents. Rather than architectural overhauls to the transformer, the biggest recent breakthroughs — such as DeepSeek-R1 — come from **inference-time scaling and post-training** via reinforcement learning.[1][2][3][4]

***

## AutoGen and Multi-Agent Collaboration

Microsoft's **AutoGen** is an open-source, event-driven framework that treats agent coordination as a **conversation**. Instead of rigid hard-coded pipelines, agents communicate in natural language, making workflows easier to debug and extend. Each agent message is persisted and logged, so emergent errors across dozens of interactions can be traced back to their source.[2][5][6]

AutoGen supports several orchestration patterns:[7]

- **Joint Chat** — agents share a common scratchpad and maintain constant awareness of each other's progress
- **Hierarchical Chat** — an orchestrator (manager) delegates to specialized sub-agents, mimicking a manager-worker org structure
- **Sequential Pipeline** — output of one agent becomes input to the next, ideal for stable content workflows (Researcher → Writer → Editor)
- **Event-Driven Workflows** — agents subscribe to event streams (e.g., a background mailbox agent) and react asynchronously
- **Parallel Fleet** — independent sub-tasks are distributed across a simultaneous fleet of agents for speed
- **Classifier-Based Routing** — a fast classifier routes tasks directly to the right specialist, reducing latency vs. a full LLM supervisor

**Magentic-One** is a reference implementation built on AutoGen demonstrating these ideas at scale — a universal agent team with role-based specialization (research, artifact creation, review) managed via hierarchical orchestration and asynchronous messaging.[5][1]

**AutoGen Studio** lowers the barrier further with a drag-and-drop, no-code graphical environment for rapidly prototyping multi-agent workflows, with built-in monitoring and debugging support.[6]

***

## The Evaluator-Optimizer (Reflection) Pattern

The **Reflection pattern** is one of the most impactful design patterns in agentic AI. It separates generation and critique into two distinct roles — an **Optimizer (Generator)** that produces a candidate output, and an **Evaluator (Critic)** that provides structured feedback — which are cycled iteratively.[2]

Why it works:

- **High output variance** in tasks like code generation means single-pass responses frequently miss subtle requirements; the critic catches these before they reach the user
- **Compounding errors** in multi-step reasoning can be caught early by a dedicated evaluator
- **Performance amplification** is dramatic — GPT-3.5 jumps from 48.1% to 95.1% on coding benchmarks when wrapped in an agentic refinement loop

Best practices include capping iteration counts to prevent runaway loops, using explicit approval criteria (e.g., `"APPROVED if satisfactory"`), and optionally inserting a human as the evaluator for high-stakes actions.

***

## Reinforcement Learning: Outcome vs. Process Rewards

Post-training via RL is now a primary driver of model capability, especially for reasoning. The central design choice is **how to reward the model**:[3][8]

| Feature | Outcome Rewards | Process Rewards |
|---|---|---|
| **Focus** | Final answer correctness [8] | Intermediate reasoning steps [3] |
| **Verification** | Deterministic parsers, compilers, unit tests [8] | Subjective model-based judges (PRMs) [9] |
| **Reward hacking risk** | Low — hard to game a math parser or compiler [8] | High — models learn "sycophantic" confident-sounding but flawed logic |
| **Compute cost** | Lower — no judge model needed in training loop [9] | Higher — requires a PRM in memory at every step |
| **Key weakness** | Ignores whether the reasoning path was sound | Susceptible to style-over-substance exploitation |

DeepSeek-R1 validated **Reinforcement Learning with Verifiable Rewards (RLVR)** as the key technique: using GRPO (Group Relative Policy Optimization), it rewards models only when final answers to math or coding problems are verifiably correct — no neural reward model needed, eliminating a major source of reward hacking.[8][10][3]

***

## Why Process Rewards Struggle with Reward Hacking

Process Reward Models (PRMs) are compelling in theory — rewarding good reasoning *steps* should produce better reasoning — but they face compounding practical issues:

1. **Imperfect judges**: PRMs are themselves LLMs and have their own flaws that target models rapidly learn to exploit rather than reason correctly[9]
2. **Style over substance**: Models learn sycophantic patterns — sounding confident and well-structured — that fool judge models without valid logic underlying the explanation
3. **The "turtles all the way down" problem**: Grading a reasoning model requires a PRM, grading the PRM requires a meta-judge, and so on indefinitely
4. **Shortcut features**: Models identify specific phrases or formatting that reliably score well with the evaluator, regardless of actual logical validity

***

## Mitigating Reward Hacking

Several strategies reduce exploitation:[11][9]

- **Verifiable/deterministic rewards**: Math parsers and code compilers replace subjective model judges entirely — a correct answer is binary and unchallengeable
- **KL-divergence penalties**: Penalizing the model for drifting too far from the base model prevents over-optimization and nonsensical outputs
- **Format + correctness balancing**: Algorithms like **GDPO** stabilize training when optimizing multiple reward signals simultaneously (e.g., a correctness reward and a `<think>` format reward)
- **Adversarial probing / red-teaming**: Systematically finding inputs that cause "reasoning drift" — where the chain of thought becomes incoherent — before deployment
- **Frequent re-labeling**: As the policy evolves, fresh human or high-quality model labels are collected on the *new* types of reasoning the model attempts, keeping the reward model calibrated

***

## The Bigger Picture

These sources collectively describe an industry transitioning from scale-driven pretraining toward **inference-time compute** and **post-training alignment** as the next frontiers. Open-source models (like DeepSeek-R1) are rapidly closing the gap with proprietary systems, and **private enterprise data** is emerging as the key moat for organizations building in-house agents. The combination of multi-agent orchestration (AutoGen/Magentic-One), reflection loops, and RLVR-based reasoning represents the current state-of-the-art architecture for reliable, high-performance AI systems.[4][3][5][11]

Sources
[1] microsoft/autogen: A programming framework for agentic AI - GitHub https://github.com/microsoft/autogen
[2] How AutoGen Framework Helps You Build Multi-Agent Systems https://galileo.ai/blog/autogen-framework-multi-agents
[3] AI 101: The State of Reinforcement Learning in 2025 - LinkedIn https://www.linkedin.com/pulse/ai-101-state-reinforcement-learning-2025-theturingpost-dovjc
[4] State of LLMs 2026: RLVR, GRPO, Inference Scaling - YouTube https://www.youtube.com/watch?v=K5WPr5dtne0
[5] AutoGen - Microsoft Research https://www.microsoft.com/en-us/research/project/autogen/
[6] AutoGen https://microsoft.github.io/autogen/stable/index.html
[7] Deep Dive into AutoGen Multi-Agent Patterns 2025 - Sparkco AI https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025
[8] How DeepSeek R1 Works: Explaining All Its Key Components and ... https://www.pedromebo.com/blog/en-how-deepseek-r1-works
[9] Beyond Verifiable Rewards: Scaling Reinforcement Learning ... - arXiv https://arxiv.org/html/2503.19618v2
[10] DeepSeek-R1: A Peek Under the Hood https://zohaib.me/deepseek-r1-peek-under-the-hood/
[11] NeurIPS Poster Does Reinforcement Learning Really Incentivize ... https://neurips.cc/virtual/2025/poster/119944
[12] AutoGen Review 2025 – Best Open‑Source Multi‑Agent Framework? https://www.youtube.com/watch?v=iAu9zOZ83Dc
[13] Microsoft AutoGen: Orchestrating Multi-Agent LLM Systems | Tribe AI https://www.tribe.ai/applied-ai/microsoft-autogen-orchestrating-multi-agent-llm-systems
[14] Deepseek R1 Rewards EXPLAINED: A Complete Breakdown https://www.youtube.com/watch?v=oh7KraROAMs
[15] Getting Started with AutoGen – A Framework for Building Multi-Agent https://singhrajeev.com/2025/02/08/getting-started-with-autogen-a-framework-for-building-multi-agent-generative-ai-applications/




Use **sequential workflow** when your steps are fixed and deterministic, and use **group chat** when agents need a shared conversation with turn-taking and dynamic speaker selection. In AutoGen’s docs, sequential workflow passes output from one agent to the next, while group chat has all agents share a common thread and a manager chooses who speaks next.[1][2]

## Sequential pattern

In AutoGen Core, sequential workflow is implemented with **publish-subscribe messaging**: each agent subscribes to its own topic, processes a message, then publishes the result to the next agent’s topic in the pipeline. This is the best fit for pipelines like “analyze → draft → review → deliver,” where order is known in advance.[1]

A minimal shape looks like this:[1]

```python
from dataclasses import dataclass
from autogen_core import (
    MessageContext, RoutedAgent, SingleThreadedAgentRuntime,
    TopicId, message_handler, type_subscription
)
from autogen_core.models import SystemMessage, UserMessage
from autogen_ext.models.openai import OpenAIChatCompletionClient

@dataclass
class Message:
    content: str

extract_topic = "Extractor"
write_topic = "Writer"
review_topic = "Reviewer"
user_topic = "User"

@type_subscription(topic_type=extract_topic)
class ExtractorAgent(RoutedAgent):
    def __init__(self, model_client):
        super().__init__("Extracts key points")
        self.model_client = model_client
        self.system = SystemMessage(content="Extract key requirements and constraints.")

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        result = await self.model_client.create(
            [self.system, UserMessage(content=message.content, source=self.id.key)],
            cancellation_token=ctx.cancellation_token,
        )
        await self.publish_message(
            Message(content=result.content),
            topic_id=TopicId(write_topic, source=self.id.key),
        )

@type_subscription(topic_type=write_topic)
class WriterAgent(RoutedAgent):
    def __init__(self, model_client):
        super().__init__("Writes draft")
        self.model_client = model_client
        self.system = SystemMessage(content="Write a draft from the extracted points.")

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        result = await self.model_client.create(
            [self.system, UserMessage(content=message.content, source=self.id.key)],
            cancellation_token=ctx.cancellation_token,
        )
        await self.publish_message(
            Message(content=result.content),
            topic_id=TopicId(review_topic, source=self.id.key),
        )

@type_subscription(topic_type=review_topic)
class ReviewerAgent(RoutedAgent):
    def __init__(self, model_client):
        super().__init__("Reviews output")
        self.model_client = model_client
        self.system = SystemMessage(content="Review and polish the draft.")

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        result = await self.model_client.create(
            [self.system, UserMessage(content=message.content, source=self.id.key)],
            cancellation_token=ctx.cancellation_token,
        )
        await self.publish_message(
            Message(content=result.content),
            topic_id=TopicId(user_topic, source=self.id.key),
        )

@type_subscription(topic_type=user_topic)
class UserAgent(RoutedAgent):
    def __init__(self):
        super().__init__("Outputs final result")

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        print(message.content)

async def main():
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")
    runtime = SingleThreadedAgentRuntime()

    await ExtractorAgent.register(runtime, type=extract_topic, factory=lambda: ExtractorAgent(model_client))
    await WriterAgent.register(runtime, type=write_topic, factory=lambda: WriterAgent(model_client))
    await ReviewerAgent.register(runtime, type=review_topic, factory=lambda: ReviewerAgent(model_client))
    await UserAgent.register(runtime, type=user_topic, factory=lambda: UserAgent())

    runtime.start()
    await runtime.publish_message(
        Message("Create a concise launch email for a new developer tool."),
        topic_id=TopicId(extract_topic, source="default"),
    )
    await runtime.stop_when_idle()
    await model_client.close()
```

### When to use it

Choose this pattern when each agent has a **predefined sub-task** and you want predictable control flow, easier testing, and simpler failure handling. A good example is ETL-style enterprise automation, where each step transforms the previous output and does not need a shared running debate.[1]

## Group chat pattern

In AutoGen Core, **group chat** means every participant subscribes to the same shared topic, and a **Group Chat Manager** controls turn-taking by sending a `RequestToSpeak` message to one participant at a time. The docs note that the conversation is still sequential in execution, but the difference is that all agents see the shared thread and the next speaker can be chosen dynamically by rules or by an LLM selector.[2]

The core message types from the docs look like this:[2]

```python
from pydantic import BaseModel
from autogen_core.models import UserMessage

class GroupChatMessage(BaseModel):
    body: UserMessage

class RequestToSpeak(BaseModel):
    pass
```

A minimal participant shape is:[2]

```python
from typing import List
from autogen_core import DefaultTopicId, MessageContext, RoutedAgent, message_handler
from autogen_core.models import AssistantMessage, SystemMessage, UserMessage

class BaseGroupChatAgent(RoutedAgent):
    def __init__(self, description, group_chat_topic_type, model_client, system_message):
        super().__init__(description=description)
        self._group_chat_topic_type = group_chat_topic_type
        self._model_client = model_client
        self._system_message = SystemMessage(content=system_message)
        self._chat_history: List = []

    @message_handler
    async def handle_message(self, message: GroupChatMessage, ctx: MessageContext) -> None:
        self._chat_history.append(message.body)

    @message_handler
    async def handle_request_to_speak(self, message: RequestToSpeak, ctx: MessageContext) -> None:
        completion = await self._model_client.create(
            [self._system_message] + self._chat_history,
            cancellation_token=ctx.cancellation_token,
        )
        self._chat_history.append(AssistantMessage(content=completion.content, source=self.id.type))
        await self.publish_message(
            GroupChatMessage(body=UserMessage(content=completion.content, source=self.id.type)),
            topic_id=DefaultTopicId(type=self._group_chat_topic_type),
        )
```

The manager chooses who goes next and sends `RequestToSpeak()` to that agent’s topic:[2]

```python
from autogen_core import DefaultTopicId, RoutedAgent, MessageContext, message_handler
from autogen_core.models import SystemMessage

class GroupChatManager(RoutedAgent):
    def __init__(self, participant_topic_types, model_client, participant_descriptions):
        super().__init__("Group chat manager")
        self._participant_topic_types = participant_topic_types
        self._participant_descriptions = participant_descriptions
        self._model_client = model_client
        self._history = []
        self._previous = None

    @message_handler
    async def handle_message(self, message: GroupChatMessage, ctx: MessageContext) -> None:
        self._history.append(message.body)

        roles = [
            p for p in self._participant_topic_types
            if p != self._previous
        ]
        history = "\n".join(f"{m.source}: {m.content}" for m in self._history if isinstance(m.content, str))
        prompt = f"""
Available roles: {roles}
Conversation:
{history}

Choose the next speaker. Return only the role name.
"""
        completion = await self._model_client.create(
            [SystemMessage(content=prompt)],
            cancellation_token=ctx.cancellation_token,
        )
        selected = completion.content.strip()
        self._previous = selected
        await self.publish_message(RequestToSpeak(), DefaultTopicId(type=selected))
```

### When to use it

Choose group chat when the task benefits from **shared context and iterative collaboration**, such as writer-editor-reviewer flows, planning with critique, or situations where a human may join for approval. AutoGen’s docs also recommend simpler rules when possible, such as always having the editor speak after the writer, instead of using an LLM selector for every turn.[2]

## AgentChat shortcuts

If you are using the newer **AgentChat** layer instead of Core, AutoGen provides built-in team abstractions such as `RoundRobinGroupChat` and `SelectorGroupChat`, so you do not need to build the manager manually. `RoundRobinGroupChat` is good when turn order is fixed, while `SelectorGroupChat` adds model-based next-speaker selection from shared context.[3][4]

This simple example shows a round-robin reviewer loop:[3]

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient

model_client = OpenAIChatCompletionClient(model="gpt-4o-2024-08-06")

primary = AssistantAgent(
    "primary",
    model_client=model_client,
    system_message="Draft the answer.",
)

critic = AssistantAgent(
    "critic",
    model_client=model_client,
    system_message="Critique the draft. Reply APPROVE when it is good enough.",
)

team = RoundRobinGroupChat(
    [primary, critic],
    termination_condition=TextMentionTermination("APPROVE"),
)
```

## Practical guidance

The clean rule is: use **sequential** when data should flow one-way through a fixed pipeline, and use **group chat** when agents need a common conversation and flexible turn-taking. One useful mental model is that sequential workflow is like an assembly line, while group chat is like a meeting moderated by a facilitator.[1][2]

For production systems, keep these design choices tight:[4][1][2]
- Prefer explicit topic routing for fixed business processes.
- Use group chat only when shared deliberation adds value.
- Replace LLM speaker selection with rules when the order is obvious.
- Add a termination condition early, such as approval text, max turns, or a final user handoff.

Would you like a full working example in **AutoGen AgentChat** or **AutoGen Core**?

Sources
[1] Deep Dive into AutoGen Multi-Agent Patterns 2025 - Sparkco AI https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025
[2] AutoGen - Microsoft Research https://www.microsoft.com/en-us/research/project/autogen/
[3] Teams — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html
[4] Selector Group Chat — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/selector-group-chat.html
[5] Group Chat — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/core-user-guide/design-patterns/group-chat.html
[6] Sequential Workflow — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/core-user-guide/design-patterns/sequential-workflow.html
[7] How to Parallelize Agents in a GroupChat Workflow #4215 - GitHub https://github.com/microsoft/autogen/discussions/4215
[8] Group Chat - AutoGen - Mintlify https://mintlify.com/microsoft/autogen/dotnet/group-chat
[9] AutoGen RoundRobinGroupChat, SelectorGroupChat, and Swarm ... https://www.youtube.com/watch?v=x8hUgWagSC0
[10] RoundRobinGroupChat, SelectorGroupChat, Swarm - AutoGen https://www.gettingstarted.ai/autogen-teams/
[11] AutoGen Conversation Patterns - Overview for Beginners https://www.gettingstarted.ai/autogen-conversation-patterns-workflows/
[12] Conversation Patterns | AutoGen 0.2 - Microsoft Open Source https://microsoft.github.io/autogen/0.2/docs/tutorial/conversation-patterns/
[13] Solving Complex Tasks with A Sequence of Nested Chats | AutoGen ... https://microsoft.github.io/autogen/0.2/docs/notebooks/agentchat_nested_sequential_chats/
[14] AutoGen to Microsoft Agent Framework Migration Guide https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/
[15] Conversation Patterns - Sequential Chat Agent Workflow - YouTube https://www.youtube.com/watch?v=7_LQ3ok35Lc
[16] RoundRobinGroupChat is kind of sequential workflow design pattern? https://github.com/microsoft/autogen/discussions/5087
[17] autogen_agentchat.teams — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.teams.html



Here is a practical AutoGen example for a **sequential workflow with termination conditions**. AutoGen’s Core sequential workflow uses publish-subscribe topics to pass work from one agent to the next, while AgentChat provides reusable termination conditions like `MaxMessageTermination` and `TextMentionTermination` that can be combined with `|` and `&` operators [1][2].

## Core example

The cleanest way to add termination to a Core sequential pipeline is to define a special termination message and stop the runtime when that signal appears. AutoGen’s Core docs show sequential routing with `TopicId(...)`, and the termination cookbook shows using an intervention handler plus `runtime.stop_when(...)` to halt execution when a termination message is published.[1][3]

```python
import asyncio
from dataclasses import dataclass
from typing import Any

from autogen_core import (
    MessageContext,
    RoutedAgent,
    SingleThreadedAgentRuntime,
    TopicId,
    message_handler,
    type_subscription,
)
from autogen_core.base.intervention import DefaultInterventionHandler
from autogen_core.models import SystemMessage, UserMessage
from autogen_ext.models.openai import OpenAIChatCompletionClient


@dataclass
class Message:
    content: str


@dataclass
class Termination:
    reason: str


extract_topic = "Extractor"
write_topic = "Writer"
review_topic = "Reviewer"
user_topic = "User"


class TerminationHandler(DefaultInterventionHandler):
    def __init__(self) -> None:
        self.has_terminated = False
        self.termination_value: Termination | None = None

    async def on_publish(self, message: Any, *, message_context: Any) -> Any:
        if isinstance(message, Termination):
            self.has_terminated = True
            self.termination_value = message
        return message


@type_subscription(topic_type=extract_topic)
class ExtractorAgent(RoutedAgent):
    def __init__(self, model_client) -> None:
        super().__init__("Extract requirements")
        self.model_client = model_client
        self.system = SystemMessage(
            content="Extract the user's goal, constraints, and required output format."
        )

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        result = await self.model_client.create(
            [self.system, UserMessage(content=message.content, source=self.id.key)],
            cancellation_token=ctx.cancellation_token,
        )
        await self.publish_message(
            Message(content=result.content),
            topic_id=TopicId(write_topic, source=self.id.key),
        )


@type_subscription(topic_type=write_topic)
class WriterAgent(RoutedAgent):
    def __init__(self, model_client) -> None:
        super().__init__("Write draft")
        self.model_client = model_client
        self.system = SystemMessage(
            content="Write a concise first draft based on the extracted requirements."
        )

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        result = await self.model_client.create(
            [self.system, UserMessage(content=message.content, source=self.id.key)],
            cancellation_token=ctx.cancellation_token,
        )
        await self.publish_message(
            Message(content=result.content),
            topic_id=TopicId(review_topic, source=self.id.key),
        )


@type_subscription(topic_type=review_topic)
class ReviewerAgent(RoutedAgent):
    def __init__(self, model_client) -> None:
        super().__init__("Review draft")
        self.model_client = model_client
        self.system = SystemMessage(
            content=(
                "Review the draft. If it is acceptable, return exactly 'APPROVED:' "
                "followed by the final text. Otherwise return 'REVISE:' followed by "
                "specific revision instructions."
            )
        )

    @message_handler
    async def handle(self, message: Message, ctx: MessageContext) -> None:
        result = await self.model_client.create(
            [self.system, UserMessage(content=message.content, source=self.id.key)],
            cancellation_token=ctx.cancellation_token,
        )
        text = result.content if isinstance(result.content, str) else str(result.content)

        if text.startswith("APPROVED:"):
            final_text = text.removeprefix("APPROVED:").strip()
            await self.publish_message(
                Message(content=final_text),
                topic_id=TopicId(user_topic, source=self.id.key),
            )
            await self.publish_message(
                Termination(reason="Reviewer approved final output"),
                topic_id=TopicId(user_topic, source=self.id.key),
            )
        else:
            await self.publish_message(
                Termination(reason="Reviewer requested revision; stopping this run"),
                topic_id=TopicId(user_topic, source=self.id.key),
            )


@type_subscription(topic_type=user_topic)
class UserAgent(RoutedAgent):
    def __init__(self) -> None:
        super().__init__("Collect final output")
        self.final_output: str | None = None

    @message_handler
    async def handle_message(self, message: Message, ctx: MessageContext) -> None:
        self.final_output = message.content
        print("\nFINAL OUTPUT:\n")
        print(message.content)

    @message_handler
    async def handle_termination(self, message: Termination, ctx: MessageContext) -> None:
        print(f"\nTERMINATION: {message.reason}")


async def main() -> None:
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")
    termination_handler = TerminationHandler()
    runtime = SingleThreadedAgentRuntime(intervention_handlers=[termination_handler])

    await ExtractorAgent.register(runtime, type=extract_topic, factory=lambda: ExtractorAgent(model_client))
    await WriterAgent.register(runtime, type=write_topic, factory=lambda: WriterAgent(model_client))
    await ReviewerAgent.register(runtime, type=review_topic, factory=lambda: ReviewerAgent(model_client))
    await UserAgent.register(runtime, type=user_topic, factory=lambda: UserAgent())

    runtime.start()

    await runtime.publish_message(
        Message("Write a short launch announcement for a privacy-focused analytics product."),
        topic_id=TopicId(extract_topic, source="default"),
    )

    await runtime.stop_when(lambda: termination_handler.has_terminated)

    if termination_handler.termination_value:
        print(f"\nSTOP REASON: {termination_handler.termination_value.reason}")

    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## How termination works

This example uses **two layers of termination**: the reviewer decides whether the pipeline is complete, and the runtime stops once the intervention handler sees a `Termination` message. That matches AutoGen Core’s event-driven design better than trying to bolt AgentChat’s group-chat termination objects directly onto Core topics.[3][1]

The termination rules are:
- Stop with success when the reviewer emits `APPROVED: ...`.
- Stop with a controlled failure when the reviewer emits `REVISE: ...`.
- End the runtime as soon as the `TerminationHandler` detects a `Termination` object.[3]

## AgentChat alternative

If you want **built-in** termination conditions instead of wiring your own runtime stop logic, AgentChat is easier because it already supports `MaxMessageTermination`, `TextMentionTermination`, token limits, handoff termination, and custom conditions, and these can be combined with `|` or `&` [2]. The docs’ canonical pattern is `combined_termination = MaxMessageTermination(...) | TextMentionTermination("APPROVE")` [2].

A compact AgentChat version looks like this:[2]

```python
import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import MaxMessageTermination, TextMentionTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient

async def main():
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")

    writer = AssistantAgent(
        "writer",
        model_client=model_client,
        system_message="Write the draft requested by the user.",
    )

    reviewer = AssistantAgent(
        "reviewer",
        model_client=model_client,
        system_message=(
            "Review the draft. Reply with feedback until it is good enough. "
            "When satisfied, include the word APPROVE."
        ),
    )

    termination = MaxMessageTermination(max_messages=8) | TextMentionTermination("APPROVE")

    team = RoundRobinGroupChat(
        [writer, reviewer],
        termination_condition=termination,
    )

    await Console(
        team.run_stream(task="Write a launch email for a privacy-focused analytics product.")
    )
    await model_client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Which to choose

Use **Core** when you want full control over topics, routing, and custom workflow semantics; use **AgentChat** when you want faster implementation and built-in stop conditions. For a strict sequential enterprise pipeline, Core is usually cleaner, but for iterative reviewer loops with message-count or text-trigger stops, AgentChat is simpler and more maintainable.[1][2]

Would you like the same example rewritten as a **retrying sequential workflow** where `REVISE:` loops back to the writer until approval or max iterations?

Sources
[1] AutoGen - Microsoft Research https://www.microsoft.com/en-us/research/project/autogen/
[2] Deep Dive into AutoGen Multi-Agent Patterns 2025 - Sparkco AI https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025
[3] Termination using Intervention Handler — AutoGen https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/cookbook/termination-with-intervention.html
[4] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html
[5] [Bug] Official Autogen tutorial "Using Termination Conditions" does ... https://github.com/microsoft/autogen/issues/5248
[6] Terminating Conversations Between Agents | AutoGen 0.2 https://microsoft.github.io/autogen/0.2/docs/tutorial/chat-termination/
[7] Sequential Workflow — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/core-user-guide/design-patterns/sequential-workflow.html
[8] TextMentionTermination terminating team on initial user message https://github.com/microsoft/autogen/issues/6826
[9] autogen_agentchat.conditions — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html
[10] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/0.4.7/user-guide/agentchat-user-guide/tutorial/termination.html
[11] AI Agents XIII : Autogen :“The multi agent conversation Framework ” https://ai.plainenglish.io/ai-agents-xiii-autogen-the-multi-agent-conversation-framework-1-fbda3e34b47e
[12] Add deterministic termination contract tests for multi-agent loops https://github.com/microsoft/autogen/issues/7275
[13] Designing Multi-Agent Workflows - AutoGen - Mintlify https://mintlify.com/microsoft/autogen/guides/multi-agent-workflows
[14] `TextMessageTermination` Condition · Issue #5732 - GitHub https://github.com/microsoft/autogen/issues/5732
[15] Conversation Patterns | AutoGen 0.2 - Microsoft Open Source https://microsoft.github.io/autogen/0.2/docs/tutorial/conversation-patterns/
[16] feat: Add Explicit Termination Mechanism for Multi-Agent Workflows ... https://github.com/google/adk-python/issues/5211
[17] autogen_agentchat.agents — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/reference/python/autogen_agentchat.agents.html


Here is a solid **SelectorGroupChat** example with a **custom termination condition**. AutoGen’s AgentChat docs show that `SelectorGroupChat` uses model-based next-speaker selection over shared context, and that termination conditions are callables over the **delta sequence of messages since the last check**, which makes custom termination straightforward.[1][2]

## Example

This example stops when either the planner says `TERMINATE`, the run exceeds 20 messages, or a custom condition detects that the planner has produced a final answer containing both `FINAL:` and `confidence=`.[2][1]

```python
import asyncio
from typing import Sequence

from pydantic import BaseModel
from typing_extensions import Self

from autogen_core import Component
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.base import TerminatedException, TerminationCondition
from autogen_agentchat.conditions import MaxMessageTermination, TextMentionTermination
from autogen_agentchat.messages import BaseAgentEvent, BaseChatMessage, StopMessage, TextMessage
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient


def search_web_tool(query: str) -> str:
    data = {
        "pricing": "Starter: $29/month, Pro: $99/month, Enterprise: custom pricing.",
        "sla": "Enterprise plan includes 99.9% uptime SLA.",
        "security": "SOC 2 Type II, SSO, audit logs, and data encryption at rest.",
    }
    q = query.lower()
    if "price" in q or "pricing" in q:
        return data["pricing"]
    if "sla" in q:
        return data["sla"]
    if "security" in q:
        return data["security"]
    return "No relevant information found."


class PlannerApprovalTerminationConfig(BaseModel):
    source_name: str = "Planner"
    required_terms: list[str]


class PlannerApprovalTermination(
    TerminationCondition,
    Component[PlannerApprovalTerminationConfig],
):
    component_config_schema = PlannerApprovalTerminationConfig
    component_provider_override = "custom.PlannerApprovalTermination"

    def __init__(self, source_name: str = "Planner", required_terms: list[str] | None = None) -> None:
        self._terminated = False
        self._source_name = source_name
        self._required_terms = required_terms or ["FINAL:", "confidence="]

    @property
    def terminated(self) -> bool:
        return self._terminated

    async def __call__(
        self,
        messages: Sequence[BaseAgentEvent | BaseChatMessage],
    ) -> StopMessage | None:
        if self._terminated:
            raise TerminatedException("Termination condition has already been reached.")

        for message in messages:
            if isinstance(message, TextMessage) and message.source == self._source_name:
                content = message.content if isinstance(message.content, str) else str(message.content)
                if all(term in content for term in self._required_terms):
                    self._terminated = True
                    return StopMessage(
                        content=(
                            f"{self._source_name} produced a final answer with all required markers: "
                            f"{', '.join(self._required_terms)}"
                        ),
                        source="PlannerApprovalTermination",
                    )
        return None

    async def reset(self) -> None:
        self._terminated = False

    def _to_config(self) -> PlannerApprovalTerminationConfig:
        return PlannerApprovalTerminationConfig(
            source_name=self._source_name,
            required_terms=self._required_terms,
        )

    @classmethod
    def _from_config(cls, config: PlannerApprovalTerminationConfig) -> Self:
        return cls(
            source_name=config.source_name,
            required_terms=config.required_terms,
        )


async def main():
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")

    planner = AssistantAgent(
        "Planner",
        description="Plans the task, delegates work, and writes the final answer.",
        model_client=model_client,
        system_message=(
            "You are the planning agent. Break down the task, delegate to specialists, "
            "and synthesize the final result. "
            "When the task is fully complete, reply with:\n"
            "FINAL: <answer>\n"
            "confidence=<high|medium|low>\n"
            "TERMINATE\n"
        ),
    )

    researcher = AssistantAgent(
        "Researcher",
        description="Looks up product facts using the search tool.",
        model_client=model_client,
        tools=[search_web_tool],
        system_message=(
            "You are a research agent. Use the search_web_tool to find facts. "
            "Do not make up product details. Keep results concise."
        ),
    )

    reviewer = AssistantAgent(
        "Reviewer",
        description="Checks whether the answer is complete and asks for missing details.",
        model_client=model_client,
        system_message=(
            "You are a reviewer. Check whether the planner's answer covers pricing, SLA, "
            "and security. If anything is missing, say exactly what is missing."
        ),
    )

    selector_prompt = """Select the next speaker.

{roles}

Conversation:
{history}

Rules:
- Planner should start.
- Researcher should gather missing facts.
- Reviewer should check completeness after substantive answers.
- Planner should finalize when enough information is available.
- Select exactly one agent from {participants}.
"""

    custom_termination = PlannerApprovalTermination(
        source_name="Planner",
        required_terms=["FINAL:", "confidence="],
    )

    termination = (
        custom_termination
        | TextMentionTermination("TERMINATE")
        | MaxMessageTermination(max_messages=20)
    )

    team = SelectorGroupChat(
        [planner, researcher, reviewer],
        model_client=model_client,
        termination_condition=termination,
        selector_prompt=selector_prompt,
        allow_repeated_speaker=False,
    )

    task = (
        "Summarize the product for an enterprise buyer. Include pricing, SLA, and security."
    )

    await Console(team.run_stream(task=task))
    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## Why this works

For `SelectorGroupChat`, AutoGen checks the termination condition **after each agent response**, and the condition receives only the new messages since the previous check, not the whole transcript. That is why the custom condition scans the incoming delta for a `TextMessage` from `Planner` and returns a `StopMessage` as soon as the required markers appear.[2]

The built-in conditions are then combined with the custom one using `|`, which AutoGen explicitly supports for OR logic across termination conditions [2]. In practice, this gives you a robust stop strategy: a semantic stop from the planner, a text-based fallback, and a hard cap to prevent loops [2][1].

## Notes

`SelectorGroupChat` supports custom speaker selection through `selector_prompt`, `selector_func`, and `candidate_func`, but the team still broadcasts each chosen speaker’s output to the shared conversation for all participants to see. Also, the docs note that custom selector functions are not serialized by `.dump_component()`, so if you need portable configs, keep the custom logic inside agents or termination conditions rather than only in selector callbacks.[1]

A useful variation is to terminate on a **tool execution event** instead of text output, following AutoGen’s custom `FunctionCallTermination` pattern shown in the termination docs. That is often more reliable than keyword matching when you want a planner or reviewer to explicitly “approve” completion through a tool call.[2]

Sources
[1] AutoGen - Microsoft Research https://www.microsoft.com/en-us/research/project/autogen/
[2] Deep Dive into AutoGen Multi-Agent Patterns 2025 - Sparkco AI https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025
[3] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html
[4] [Bug] SelectorGroupChat termination conditions fail to ... - GitHub https://github.com/microsoft/autogen/issues/7071
[5] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/0.4.7/user-guide/agentchat-user-guide/tutorial/termination.html
[6] thoughts on a pattern, a selector that can end a chat? Modifying the ... https://github.com/microsoft/autogen/discussions/5997
[7] Selector Group Chat — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/selector-group-chat.html
[8] Selector Group Chat — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/selector-group-chat.html
[9] Custom Agents — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/custom-agents.html
[10] AutoGen RoundRobinGroupChat, SelectorGroupChat, and Swarm ... https://www.youtube.com/watch?v=x8hUgWagSC0
[11] [Python] Termination on Agent Selection · Issue #5335 - GitHub https://github.com/microsoft/autogen/issues/5335
[12] autogen_agentchat.conditions — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html
[13] Termination Conditions within Agents · Issue #4307 - GitHub https://github.com/microsoft/autogen/issues/4307
[14] Stop strategy in group chat ? : r/AutoGenAI - Reddit https://www.reddit.com/r/AutoGenAI/comments/1atvb3x/stop_strategy_in_group_chat/
[15] autogen_agentchat.agents — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/reference/python/autogen_agentchat.agents.html
[16] Tutorial Chapter for `SelectorGroupChat` · Issue #4112 - GitHub https://github.com/microsoft/autogen/issues/4112
[17] Terminating Conversations Between Agents | AutoGen 0.2 https://microsoft.github.io/autogen/0.2/docs/tutorial/chat-termination/

Yes — a **stateful custom termination condition** is useful in `SelectorGroupChat` when stopping depends on information accumulated across multiple turns, not just the latest message batch. AutoGen’s docs explicitly say termination conditions are **stateful**, are called with the **delta sequence since the last check**, and must implement `reset()` because the team may continue across runs.[1][2]

## Example

This example stops only after the `Planner` has first declared a draft complete and then the `Reviewer` has approved it in a later turn. That requires internal state, because those two signals arrive in different message batches in a `SelectorGroupChat` run.[2][1]

```python
import asyncio
from typing import Sequence

from pydantic import BaseModel
from typing_extensions import Self

from autogen_core import Component
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.base import TerminatedException, TerminationCondition
from autogen_agentchat.conditions import MaxMessageTermination
from autogen_agentchat.messages import BaseAgentEvent, BaseChatMessage, StopMessage, TextMessage
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient


class PlannerReviewerTerminationConfig(BaseModel):
    planner_name: str = "Planner"
    reviewer_name: str = "Reviewer"
    planner_marker: str = "READY_FOR_REVIEW"
    reviewer_marker: str = "APPROVED"


class PlannerReviewerTermination(
    TerminationCondition,
    Component[PlannerReviewerTerminationConfig],
):
    component_config_schema = PlannerReviewerTerminationConfig
    component_provider_override = "custom.PlannerReviewerTermination"

    def __init__(
        self,
        planner_name: str = "Planner",
        reviewer_name: str = "Reviewer",
        planner_marker: str = "READY_FOR_REVIEW",
        reviewer_marker: str = "APPROVED",
    ) -> None:
        self._terminated = False
        self._planner_name = planner_name
        self._reviewer_name = reviewer_name
        self._planner_marker = planner_marker
        self._reviewer_marker = reviewer_marker

        self._planner_ready = False
        self._review_approved = False
        self._approval_count = 0

    @property
    def terminated(self) -> bool:
        return self._terminated

    async def __call__(
        self,
        messages: Sequence[BaseAgentEvent | BaseChatMessage],
    ) -> StopMessage | None:
        if self._terminated:
            raise TerminatedException("Termination condition has already been reached")

        for message in messages:
            if not isinstance(message, TextMessage):
                continue

            content = message.content if isinstance(message.content, str) else str(message.content)

            if message.source == self._planner_name and self._planner_marker in content:
                self._planner_ready = True

            if message.source == self._reviewer_name and self._reviewer_marker in content:
                self._review_approved = True
                self._approval_count += 1

        if self._planner_ready and self._review_approved:
            self._terminated = True
            return StopMessage(
                content=(
                    f"Stopped after planner signaled '{self._planner_marker}' "
                    f"and reviewer signaled '{self._reviewer_marker}'. "
                    f"Reviewer approvals seen: {self._approval_count}"
                ),
                source="PlannerReviewerTermination",
            )

        return None

    async def reset(self) -> None:
        self._terminated = False
        self._planner_ready = False
        self._review_approved = False
        self._approval_count = 0

    def _to_config(self) -> PlannerReviewerTerminationConfig:
        return PlannerReviewerTerminationConfig(
            planner_name=self._planner_name,
            reviewer_name=self._reviewer_name,
            planner_marker=self._planner_marker,
            reviewer_marker=self._reviewer_marker,
        )

    @classmethod
    def _from_config(cls, config: PlannerReviewerTerminationConfig) -> Self:
        return cls(
            planner_name=config.planner_name,
            reviewer_name=config.reviewer_name,
            planner_marker=config.planner_marker,
            reviewer_marker=config.reviewer_marker,
        )


async def main():
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")

    planner = AssistantAgent(
        "Planner",
        description="Owns the plan, delegates work, and prepares the final answer.",
        model_client=model_client,
        system_message=(
            "You are the planner. Coordinate the team. "
            "When you believe the answer is complete enough for review, include the exact token "
            "'READY_FOR_REVIEW'. Do not say APPROVED."
        ),
    )

    researcher = AssistantAgent(
        "Researcher",
        description="Finds relevant facts and missing context.",
        model_client=model_client,
        system_message=(
            "You are a researcher. Provide concise factual support to help the planner."
        ),
    )

    reviewer = AssistantAgent(
        "Reviewer",
        description="Checks completeness and quality of the planner's draft.",
        model_client=model_client,
        system_message=(
            "You are a reviewer. If the planner's response is good enough, include the exact token "
            "'APPROVED'. Otherwise explain what is missing."
        ),
    )

    selector_prompt = """Select the next speaker.

{roles}

Conversation:
{history}

Rules:
- Planner should start.
- Researcher should help when facts or clarification are needed.
- Reviewer should evaluate planner outputs.
- Prefer Planner after Researcher so the planner can integrate findings.
- Select exactly one participant from {participants}.
"""

    stateful_termination = PlannerReviewerTermination()
    hard_cap = MaxMessageTermination(max_messages=20)
    termination = stateful_termination | hard_cap

    team = SelectorGroupChat(
        [planner, researcher, reviewer],
        model_client=model_client,
        selector_prompt=selector_prompt,
        termination_condition=termination,
        allow_repeated_speaker=False,
    )

    await Console(
        team.run_stream(
            task="Draft a short buyer-facing summary of a B2B analytics product, then review it."
        )
    )

    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## Why this is stateful

This condition stores three pieces of internal state: whether the planner has declared `READY_FOR_REVIEW`, whether the reviewer has emitted `APPROVED`, and how many approvals have appeared so far. That matters because `SelectorGroupChat` checks termination only after each agent response, and the condition receives only the **new** messages from that response, not the entire chat history every time.[3][1][2]

Without state, the condition would miss multi-step logic like “planner marks ready in turn 4, reviewer approves in turn 6,” because those signals do not coexist in the same delta batch. This is exactly the kind of case where a custom `TerminationCondition` is better than a simple `TextMentionTermination`.[1]

## Practical variants

A common extension is to require **two reviewer approvals** before stopping, such as one content approval and one compliance approval, by incrementing `_approval_count` and terminating only when it reaches 2. Another is to track a boolean like `_saw_tool_result` or `_saw_handoff` so termination depends on both content and workflow events, which fits AutoGen’s message-based model well.[2][1]

## When to use this

Use a stateful condition when stopping depends on **sequence**, **memory**, or **cross-turn accumulation**, not just one keyword in one message. For simple cases like “stop when Planner says TERMINATE,” the built-in text-based conditions are simpler; for “stop after planner draft, reviewer approval, and no unresolved critique,” a custom stateful condition is the right pattern.[3][1]

Sources
[1] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html
[2] Deep Dive into AutoGen Multi-Agent Patterns 2025 - Sparkco AI https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025
[3] AutoGen - Microsoft Research https://www.microsoft.com/en-us/research/project/autogen/
[4] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/0.4.7/user-guide/agentchat-user-guide/tutorial/termination.html
[5] [Bug] SelectorGroupChat termination conditions fail to ... - GitHub https://github.com/microsoft/autogen/issues/7071
[6] thoughts on a pattern, a selector that can end a chat? Modifying the ... https://github.com/microsoft/autogen/discussions/5997
[7] autogen_agentchat.conditions — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html
[8] Stop Conditions for specific agents only · Issue #4807 - GitHub https://github.com/microsoft/autogen/issues/4807
[9] [Bug] Official Autogen tutorial "Using Termination Conditions" does ... https://github.com/microsoft/autogen/issues/5248
[10] Selector Group Chat — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/selector-group-chat.html
[11] Termination Conditions within Agents · Issue #4307 - GitHub https://github.com/microsoft/autogen/issues/4307
[12] `TextMessageTermination` Condition · Issue #5732 - GitHub https://github.com/microsoft/autogen/issues/5732
[13] AutoGen RoundRobinGroupChat, SelectorGroupChat, and Swarm ... https://www.youtube.com/watch?v=x8hUgWagSC0
[14] Termination message explanation : r/AutoGenAI - Reddit https://www.reddit.com/r/AutoGenAI/comments/18nrx66/termination_message_explanation/
[15] Controlling AutoGen Termination: Stopping the "Politeness Loop" https://cloudatler.com/blog/controlling-autogen-termination-stopping-the-politeness-loop-
[16] [Python] Termination on Agent Selection · Issue #5335 - GitHub https://github.com/microsoft/autogen/issues/5335
[17] Use External termination condition to stop execution in AGS #4376 https://github.com/microsoft/autogen/issues/4376


You combine multiple custom termination conditions in `SelectorGroupChat` the same way you combine built-in ones: with `|` for **OR** and `&` for **AND**. AutoGen’s termination docs explicitly support composition with these operators, and `SelectorGroupChat` checks the combined condition after each agent response using the delta sequence of new messages since the last check [1][2].

## Basic pattern

Each custom condition subclasses `TerminationCondition`, returns a `StopMessage` when triggered, and tracks its own internal state until `reset()` is called. Once you have multiple such conditions, you can compose them directly before passing them into `SelectorGroupChat`.[1]

```python
termination = custom_condition_a | custom_condition_b | MaxMessageTermination(max_messages=20)

team = SelectorGroupChat(
    [planner, researcher, reviewer],
    model_client=model_client,
    termination_condition=termination,
)
```

This means the chat stops as soon as **any** branch returns a `StopMessage`. If instead you want multiple custom conditions to all be satisfied before stopping, use `&`.[1]

## Example

This example combines two **custom** conditions plus one built-in safeguard:
- `PlannerReadyTermination`: fires when the planner says `READY_FOR_REVIEW`.
- `ReviewerApprovalTermination`: fires when the reviewer says `APPROVED`.
- `MaxMessageTermination`: stops runaway loops after 20 messages.[1]

Because `&` means both custom conditions must be satisfied, the chat will stop only after the planner has marked the draft ready **and** the reviewer has approved it, or earlier if the hard cap is reached.[1]

```python
import asyncio
from typing import Sequence

from pydantic import BaseModel
from typing_extensions import Self

from autogen_core import Component
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.base import TerminatedException, TerminationCondition
from autogen_agentchat.conditions import MaxMessageTermination
from autogen_agentchat.messages import BaseAgentEvent, BaseChatMessage, StopMessage, TextMessage
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient


class PlannerReadyConfig(BaseModel):
    source_name: str = "Planner"
    marker: str = "READY_FOR_REVIEW"


class PlannerReadyTermination(TerminationCondition, Component[PlannerReadyConfig]):
    component_config_schema = PlannerReadyConfig
    component_provider_override = "custom.PlannerReadyTermination"

    def __init__(self, source_name: str = "Planner", marker: str = "READY_FOR_REVIEW") -> None:
        self._terminated = False
        self._source_name = source_name
        self._marker = marker

    @property
    def terminated(self) -> bool:
        return self._terminated

    async def __call__(self, messages: Sequence[BaseAgentEvent | BaseChatMessage]) -> StopMessage | None:
        if self._terminated:
            raise TerminatedException("PlannerReadyTermination already reached")

        for message in messages:
            if isinstance(message, TextMessage) and message.source == self._source_name:
                content = message.content if isinstance(message.content, str) else str(message.content)
                if self._marker in content:
                    self._terminated = True
                    return StopMessage(
                        content=f"{self._source_name} emitted {self._marker}",
                        source="PlannerReadyTermination",
                    )
        return None

    async def reset(self) -> None:
        self._terminated = False

    def _to_config(self) -> PlannerReadyConfig:
        return PlannerReadyConfig(source_name=self._source_name, marker=self._marker)

    @classmethod
    def _from_config(cls, config: PlannerReadyConfig) -> Self:
        return cls(source_name=config.source_name, marker=config.marker)


class ReviewerApprovalConfig(BaseModel):
    source_name: str = "Reviewer"
    marker: str = "APPROVED"


class ReviewerApprovalTermination(TerminationCondition, Component[ReviewerApprovalConfig]):
    component_config_schema = ReviewerApprovalConfig
    component_provider_override = "custom.ReviewerApprovalTermination"

    def __init__(self, source_name: str = "Reviewer", marker: str = "APPROVED") -> None:
        self._terminated = False
        self._source_name = source_name
        self._marker = marker

    @property
    def terminated(self) -> bool:
        return self._terminated

    async def __call__(self, messages: Sequence[BaseAgentEvent | BaseChatMessage]) -> StopMessage | None:
        if self._terminated:
            raise TerminatedException("ReviewerApprovalTermination already reached")

        for message in messages:
            if isinstance(message, TextMessage) and message.source == self._source_name:
                content = message.content if isinstance(message.content, str) else str(message.content)
                if self._marker in content:
                    self._terminated = True
                    return StopMessage(
                        content=f"{self._source_name} emitted {self._marker}",
                        source="ReviewerApprovalTermination",
                    )
        return None

    async def reset(self) -> None:
        self._terminated = False

    def _to_config(self) -> ReviewerApprovalConfig:
        return ReviewerApprovalConfig(source_name=self._source_name, marker=self._marker)

    @classmethod
    def _from_config(cls, config: ReviewerApprovalConfig) -> Self:
        return cls(source_name=config.source_name, marker=config.marker)


async def main():
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")

    planner = AssistantAgent(
        "Planner",
        description="Owns the plan and prepares the final draft.",
        model_client=model_client,
        system_message=(
            "You are the planner. Coordinate the team and draft the answer. "
            "When the answer is complete enough for review, include READY_FOR_REVIEW."
        ),
    )

    researcher = AssistantAgent(
        "Researcher",
        description="Provides supporting facts and missing context.",
        model_client=model_client,
        system_message="You are a researcher. Provide concise supporting facts only.",
    )

    reviewer = AssistantAgent(
        "Reviewer",
        description="Approves or critiques the planner's draft.",
        model_client=model_client,
        system_message=(
            "You are a reviewer. If the planner's draft is good enough, include APPROVED. "
            "Otherwise explain what is missing."
        ),
    )

    selector_prompt = """Select the next speaker.

{roles}

Conversation:
{history}

Rules:
- Planner should start.
- Researcher should provide support when facts are missing.
- Reviewer should evaluate planner drafts.
- Planner should revise after reviewer feedback.
- Select exactly one participant from {participants}.
"""

    planner_ready = PlannerReadyTermination()
    reviewer_approved = ReviewerApprovalTermination()
    hard_cap = MaxMessageTermination(max_messages=20)

    termination = (planner_ready & reviewer_approved) | hard_cap

    team = SelectorGroupChat(
        [planner, researcher, reviewer],
        model_client=model_client,
        selector_prompt=selector_prompt,
        allow_repeated_speaker=False,
        termination_condition=termination,
    )

    await Console(
        team.run_stream(
            task="Create and review a short buyer-facing summary of an enterprise analytics platform."
        )
    )

    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## Logic options

The most common combinations are these:[1]
- `a | b`: stop when **either** condition fires.
- `a & b`: stop only when **both** conditions have fired.
- `(a & b) | c`: require two semantic conditions, but also keep a hard escape hatch like max messages or timeout.

A practical reading of the example is: “Stop when the planner has declared readiness and the reviewer has approved, or stop anyway if the chat runs too long”.[2][1]

## Stateful behavior

This works because termination conditions are **stateful**, so after `PlannerReadyTermination` fires once, it stays satisfied while later turns continue until `ReviewerApprovalTermination` also fires. That matters in `SelectorGroupChat` because the team evaluates termination after each response on the new message delta, not on the full transcript every time.[2][1]

If your custom conditions are not stateful, `a & b` will often fail for multi-turn workflows because the two signals usually arrive in different turns. In practice, each condition should remember whether it has already been satisfied until the run ends or `reset()` is called.[1]

## Tips

Use small, single-purpose custom conditions instead of one giant condition class, then compose them with `&` and `|` for clearer logic and easier testing [1]. Also add at least one hard-stop safeguard like `MaxMessageTermination` or `TimeoutTermination`, because selector-driven chats can otherwise drift or loop when speaker selection remains valid but progress stalls [1][3].

A useful pattern is:
```python
termination = (custom_semantic_a & custom_semantic_b) | MaxMessageTermination(30)
```
That gives you **business-logic correctness** plus operational safety.[1]

Would you like an example where one custom condition listens for a **tool call event** and another listens for a **review approval text**, then combines both in `SelectorGroupChat`?

Sources
[1] Deep Dive into AutoGen Multi-Agent Patterns 2025 - Sparkco AI https://sparkco.ai/blog/deep-dive-into-autogen-multi-agent-patterns-2025
[2] AutoGen - Microsoft Research https://www.microsoft.com/en-us/research/project/autogen/
[3] Selector Group Chat — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/user-guide/agentchat-user-guide/selector-group-chat.html
[4] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html
[5] thoughts on a pattern, a selector that can end a chat? Modifying the ... https://github.com/microsoft/autogen/discussions/5997
[6] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/0.4.7/user-guide/agentchat-user-guide/tutorial/termination.html
[7] [Bug] SelectorGroupChat termination conditions fail to ... - GitHub https://github.com/microsoft/autogen/issues/7071
[8] A Friendly Introduction to the AutoGen Framework (v0.4 API) https://newsletter.victordibia.com/p/a-friendly-introduction-to-the-autogen
[9] GroupChat - AG2 https://docs.ag2.ai/latest/docs/api-reference/autogen/GroupChat/
[10] AutoGen RoundRobinGroupChat, SelectorGroupChat, and Swarm ... https://www.youtube.com/watch?v=x8hUgWagSC0
[11] Terminating Conversations Between Agents | AutoGen 0.2 https://microsoft.github.io/autogen/0.2/docs/tutorial/chat-termination/
[12] Stop strategy in group chat ? : r/AutoGenAI - Reddit https://www.reddit.com/r/AutoGenAI/comments/1atvb3x/stop_strategy_in_group_chat/
[13] Termination Conditions within Agents · Issue #4307 - GitHub https://github.com/microsoft/autogen/issues/4307
[14] [Question] Existing Solutions for Encapsulating SelectorGroupChat ... https://github.com/microsoft/autogen/discussions/6605
[15] autogen_agentchat.conditions — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html
[16] Start a rap battle between agents with AutoGen - Adding tools https://www.developerscantina.com/p/autogen-tools-selector-group-chat/

Here is a full example combining a **tool-call termination condition** and a **review approval text termination condition** in `SelectorGroupChat`. AutoGen's official docs show that tool-call termination works by detecting `ToolCallExecutionEvent` messages in the delta sequence, while text-based termination scans `TextMessage` content — both are then combined with `&` or `|` [1][2].

## Example

The scenario: a `Researcher` calls a tool named `mark_research_complete` to signal that evidence gathering is done, and separately a `Reviewer` must then emit `APPROVED` in a text message. The chat stops when **both** signals have fired, or when a hard cap of 20 messages is hit.[1][2]

```python
import asyncio
from typing import Sequence

from pydantic import BaseModel
from typing_extensions import Self

from autogen_core import Component
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.base import TerminatedException, TerminationCondition
from autogen_agentchat.conditions import MaxMessageTermination
from autogen_agentchat.messages import (
    BaseAgentEvent,
    BaseChatMessage,
    StopMessage,
    TextMessage,
    ToolCallExecutionEvent,
)
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient


# ─── Tool the Researcher calls to mark completion ─────────────────────────────

def mark_research_complete(summary: str) -> str:
    """Signal that research is complete. Pass a one-line summary of findings."""
    return f"Research complete: {summary}"


# ─── Condition 1: fires when mark_research_complete() is executed ─────────────

class ToolCallTerminationConfig(BaseModel):
    function_name: str = "mark_research_complete"


class ToolCallTermination(TerminationCondition, Component[ToolCallTerminationConfig]):
    component_config_schema = ToolCallTerminationConfig
    component_provider_override = "custom.ToolCallTermination"

    def __init__(self, function_name: str = "mark_research_complete") -> None:
        self._terminated = False
        self._function_name = function_name

    @property
    def terminated(self) -> bool:
        return self._terminated

    async def __call__(
        self,
        messages: Sequence[BaseAgentEvent | BaseChatMessage],
    ) -> StopMessage | None:
        if self._terminated:
            raise TerminatedException("ToolCallTermination already reached")

        for message in messages:
            if isinstance(message, ToolCallExecutionEvent):
                for result in message.content:
                    if result.name == self._function_name:
                        self._terminated = True
                        return StopMessage(
                            content=f"Tool '{self._function_name}' was executed.",
                            source="ToolCallTermination",
                        )
        return None

    async def reset(self) -> None:
        self._terminated = False

    def _to_config(self) -> ToolCallTerminationConfig:
        return ToolCallTerminationConfig(function_name=self._function_name)

    @classmethod
    def _from_config(cls, config: ToolCallTerminationConfig) -> Self:
        return cls(function_name=config.function_name)


# ─── Condition 2: fires when the Reviewer emits APPROVED ──────────────────────

class ReviewApprovalConfig(BaseModel):
    source_name: str = "Reviewer"
    marker: str = "APPROVED"


class ReviewApprovalTermination(TerminationCondition, Component[ReviewApprovalConfig]):
    component_config_schema = ReviewApprovalConfig
    component_provider_override = "custom.ReviewApprovalTermination"

    def __init__(self, source_name: str = "Reviewer", marker: str = "APPROVED") -> None:
        self._terminated = False
        self._source_name = source_name
        self._marker = marker

    @property
    def terminated(self) -> bool:
        return self._terminated

    async def __call__(
        self,
        messages: Sequence[BaseAgentEvent | BaseChatMessage],
    ) -> StopMessage | None:
        if self._terminated:
            raise TerminatedException("ReviewApprovalTermination already reached")

        for message in messages:
            if isinstance(message, TextMessage) and message.source == self._source_name:
                content = (
                    message.content
                    if isinstance(message.content, str)
                    else str(message.content)
                )
                if self._marker in content:
                    self._terminated = True
                    return StopMessage(
                        content=f"{self._source_name} emitted '{self._marker}'.",
                        source="ReviewApprovalTermination",
                    )
        return None

    async def reset(self) -> None:
        self._terminated = False

    def _to_config(self) -> ReviewApprovalConfig:
        return ReviewApprovalConfig(source_name=self._source_name, marker=self._marker)

    @classmethod
    def _from_config(cls, config: ReviewApprovalConfig) -> Self:
        return cls(source_name=config.source_name, marker=config.marker)


# ─── Agents ───────────────────────────────────────────────────────────────────

async def main() -> None:
    model_client = OpenAIChatCompletionClient(model="gpt-4o-mini")

    planner = AssistantAgent(
        "Planner",
        description="Breaks down the task and delegates to Researcher or Reviewer.",
        model_client=model_client,
        system_message=(
            "You are the planner. Coordinate research and review. "
            "Ask Researcher to gather evidence first, then ask Reviewer to approve."
        ),
    )

    researcher = AssistantAgent(
        "Researcher",
        description="Gathers supporting evidence and calls mark_research_complete when done.",
        model_client=model_client,
        tools=[mark_research_complete],
        system_message=(
            "You are a researcher. Gather the facts needed to answer the task. "
            "When you have enough evidence, call mark_research_complete with a one-line summary."
        ),
    )

    reviewer = AssistantAgent(
        "Reviewer",
        description="Checks that the answer is accurate and complete.",
        model_client=model_client,
        system_message=(
            "You are a reviewer. Check the planner's answer for accuracy and completeness. "
            "If the answer is good, include the word APPROVED. "
            "Otherwise explain what is missing."
        ),
    )

    selector_prompt = """Select the next speaker.

{roles}

Conversation:
{history}

Rules:
- Planner should start.
- Researcher should gather evidence before the answer is written.
- Reviewer should evaluate only after the Researcher has finished.
- Planner should finalize the answer once Reviewer has given feedback.
- Select exactly one participant from {participants}.
"""

    # Combine: both signals required (AND), plus a hard escape hatch (OR)
    termination = (
        ToolCallTermination(function_name="mark_research_complete")
        & ReviewApprovalTermination(source_name="Reviewer", marker="APPROVED")
    ) | MaxMessageTermination(max_messages=20)

    team = SelectorGroupChat(
        [planner, researcher, reviewer],
        model_client=model_client,
        selector_prompt=selector_prompt,
        allow_repeated_speaker=False,
        termination_condition=termination,
    )

    await Console(
        team.run_stream(
            task="Research and summarize the key enterprise pricing considerations for a SaaS analytics product."
        )
    )

    await model_client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## How the two conditions interact

The key difference between the two conditions is what **message type** they scan:[1]

| Condition | Scans | Fires when |
|---|---|---|
| `ToolCallTermination` | `ToolCallExecutionEvent` | Researcher's `mark_research_complete` tool runs |
| `ReviewApprovalTermination` | `TextMessage` | Reviewer's message contains `APPROVED` |
| `MaxMessageTermination` | counts all messages | 20 messages reached |

Because termination conditions are **stateful**, each one remembers it has been satisfied across turns [3][1]. When combined with `&`, AutoGen's `AndTerminationCondition` only emits a final `StopMessage` once both inner conditions have returned a `StopMessage` in their respective turns [2]. The `|` with `MaxMessageTermination` is an unconditional escape hatch in case the chat loops without resolving either signal [1].

## Useful extensions

A natural variation is to require the tool to carry a **minimum confidence value** in its arguments, checking `result.content` inside `ToolCallTermination.__call__` before flipping `_terminated`. Another extension is to track **which specific reviewer** approved using a multi-source version of `ReviewApprovalTermination`, requiring both a content reviewer and a compliance reviewer before stopping.[2][1]

Sources
[1] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/termination.html
[2] autogen_agentchat.conditions — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html
[3] Termination — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/0.4.7/user-guide/agentchat-user-guide/tutorial/termination.html
[4] Callback function on termination condition or human in the loop #4033 https://github.com/microsoft/autogen/discussions/4033
[5] Termination Conditions within Agents · Issue #4307 - GitHub https://github.com/microsoft/autogen/issues/4307
[6] Autogen agent chat termination not terminating the way I want it to. https://github.com/microsoft/autogen/discussions/6568
[7] autogen_agentchat.teams — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/0.4.5/reference/python/autogen_agentchat.teams.html
[8] ConversableAgent - AG2 Documentation https://docs.ag2.ai/latest/docs/api-reference/autogen/ConversableAgent/
[9] Task Solving with Provided Tools as Functions (Asynchronous ... https://microsoft.github.io/autogen/0.2/docs/notebooks/agentchat_function_call_async/
[10] Inside AutoGen: Chapter 6 — Memory | by Okan Yenigün https://blog.stackademic.com/inside-autogen-chapter-6-memory-dd7313dac879
[11] Function Calling - AutoGen - Mintlify https://www.mintlify.com/microsoft/autogen/dotnet/function-calling
[12] autogen_agentchat.agents — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/dev/reference/python/autogen_agentchat.agents.html
[13] Agents — AutoGen - Microsoft Open Source https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/agents.html
[14] How to Use Functions in AutoGen Tutorial - YouTube https://www.youtube.com/watch?v=deOww_DDNdw
[15] Multi tool call : r/AutoGenAI - Reddit https://www.reddit.com/r/AutoGenAI/comments/1jewt0d/multi_tool_call/









These sources examine the rapidly evolving landscape of **agentic AI systems** and **post-training methodologies** such as **reinforcement learning**. Microsoft’s **AutoGen framework** highlights the shift toward **multi-agent ecosystems** where specialized AI entities collaborate autonomously or with **human-in-the-loop** oversight to solve complex business processes. Technical insights from Sebastian Raschka and recent research suggest that major breakthroughs now stem from **inference scaling** and **verifiable rewards** rather than fundamental changes to the **transformer architecture**. Furthermore, studies in **robotics** and **reasoning models** emphasize the importance of **deep reinforcement learning** for creating systems capable of long-horizon tasks in the physical world. While **open-source models** are becoming more competitive, the integration of **private data** remains a critical differentiator for enterprises developing in-house AI. Collectively, the texts portray a transition from simple chatbots to **sophisticated agents** that use tools and **iterative reasoning** to improve reliability and performance.


AutoGen helps teams of agents collaborate on tasks by providing a framework centered on a **conversational, event-driven architecture** that allows specialized agents to communicate and solve complex goals together. [1-3]

Key ways AutoGen facilitates this collaboration include:

### 1. Role-Based Specialization
AutoGen allows developers to create teams composed of agents with **distinct roles and specialized capabilities**. [4] For example, a business process automation team might include one agent for research, another for creating artifacts, and a third for performing reviews. [4] A notable example of this is **Magentic-One**, a universal agent team built using the framework. [2]

### 2. Conversational Interaction
Unlike frameworks that rely on rigid hard-coded sequences, AutoGen frames agent interaction as a **conversation**. [3] Agents use natural language to communicate, allowing them to:
*   **Decompose tasks:** Break down a high-level goal into manageable sub-tasks. [1, 2]
*   **Debate and iterate:** Collaborate on solutions through back-and-forth dialogue. [1, 2]
*   **Share context:** Pass information across information boundaries to maintain a shared understanding of the task. [2]

### 3. Asynchronous, Event-Driven Workflows
The framework (specifically version 0.4 and beyond) supports **distributed, long-running agents** that communicate via **asynchronous messages**. [2] This enables the creation of scalable networks where agents can react to events—such as a background mailbox agent screening emails and triggering actions based on user preferences—rather than just responding to immediate user prompts. [2, 5]

### 4. Flexible Orchestration Patterns
AutoGen supports various collaboration structures to mimic organizational workflows, including:
*   **Joint Chat:** Agents collaborating in a common space. [1]
*   **Hierarchical Chat:** Orchestration agents managing sub-agents, similar to a human manager-worker relationship. [1, 4]
*   **Human-in-the-Loop:** Agents can autonomously solve tasks while still allowing for **human oversight and intervention** through natural language interaction. [1]

### 5. Visual Prototyping
To simplify team creation, **AutoGen Studio** provides a graphical interface where users can **drag and drop** specialized agents into a workflow. [2, 6] This allows for rapid prototyping of multi-agent solutions without the need to write extensive orchestration code. [6]

The **Evaluator-Optimizer** pattern (frequently referred to as the **Reflection pattern**) refines agent outputs through a dedicated iterative loop of generation and critique [1, 2]. This structure allows an AI system to evaluate its own work against specific criteria before finalizing a result [1].

### How the Pattern Works
This workflow typically involves two distinct roles—which can be separate LLM calls or even separate models—to minimize the "cognitive load" of managing the entire process at once:

*   **The Optimizer (Generator):** Produces an initial candidate output based on the user's request [2-4].
*   **The Evaluator (Critic):** Critiques the candidate output, suggesting modifications, deletions, or improvements to style and structure [3, 4].
*   **The Refinement Loop:** The structured critique is fed back to the Optimizer, which generates a revised version [2-4]. This cycle repeats for a fixed number of iterations ($n$) or until the Evaluator identifies no further improvements [4-6].

### Why it Helps Refine Outputs
This pattern is particularly effective for tasks where **correctness and precision** matter more than speed, helping to overcome the following challenges:

*   **Handling High Output Variance:** For complex tasks like **code generation**, single-pass responses often appear plausible but fail to meet subtle requirements [7]. Reflection catches these issues before they reach the user [7].
*   **Preventing Compounding Errors:** In multi-step reasoning, an early mistake can derail the entire solution; an evaluator can identify these "silent errors" early in the process [7, 8].
*   **Bridging Inexact Specs:** Tasks like **translation** rarely have a perfect one-to-one match between languages; multiple iterations allow the model to better align the meaning across both languages [2].
*   **Performance Gains:** Iterative workflows can dramatically boost the performance of smaller models. For example, while GPT-3.5 typically scores 48.1% on coding benchmarks, wrapping it in an agentic refinement loop can increase its performance to **95.1%** [9].

### Implementation Best Practices
To ensure the pattern remains efficient in production, developers often use the following strategies:
*   **Iteration Caps:** Capping the number of cycles prevents expensive "runaway loops" where the model might refine indefinitely [4].
*   **Explicit Criteria:** Defining clear evaluation criteria (e.g., "APPROVED if satisfactory") helps the critic provide actionable feedback [4, 10].
*   **Human-in-the-Loop:** A human can act as the evaluator, approving, editing, or rejecting the agent's proposed actions (such as code execution) before they are finalized [2, 11].
**Magentic-One** is a universal agent team built using the **AutoGen** framework, designed to demonstrate the framework's capacity for solving complex, multi-step tasks through agent collaboration [1]. 

Its primary capabilities and characteristics include:

*   **Task Decomposition and Collaboration:** Magentic-One is engineered to take a high-level goal and **decompose it into multiple sub-tasks**. Specialized agents then work together collaboratively to solve these sub-tasks [1].
*   **Role-Based Specialization:** The team is composed of agents with **distinct roles and specialized abilities**. For example, a universal team like Magentic-One might include an agent dedicated to **research**, another for **creating artifacts**, and a third for **performing reviews** [2].
*   **Hierarchical Orchestration:** The interactions within the team are managed by **orchestration agents**. This structure often mimics human **organizational workflows**, where a manager agent oversees and directs the efforts of specialized workers [2].
*   **Event-Driven and Asynchronous Communication:** Built on the AutoGen 0.4 architecture, Magentic-One utilizes **asynchronous messages** to coordinate its distributed agents. This allows the team to operate as a scalable network, collaborating effectively across different information boundaries [1].
*   **Complex Problem Solving:** It has demonstrated high-level performance on agentic benchmarks that require sophisticated planning and the ability to execute sequences of actions autonomously on behalf of humans [3].

In essence, Magentic-One serves as a template for building **general-purpose multi-agent systems** that can handle a wide variety of business processes and novel AI-based challenges by leveraging a group of specialized, coordinated AI actors [2, 3].
**Magentic-One** is a universal agent team built using the **AutoGen** framework, designed to demonstrate the framework's capacity for solving complex, multi-step tasks through agent collaboration [1]. 

Its primary capabilities and characteristics include:

*   **Task Decomposition and Collaboration:** Magentic-One is engineered to take a high-level goal and **decompose it into multiple sub-tasks**. Specialized agents then work together collaboratively to solve these sub-tasks [1].
*   **Role-Based Specialization:** The team is composed of agents with **distinct roles and specialized abilities**. For example, a universal team like Magentic-One might include an agent dedicated to **research**, another for **creating artifacts**, and a third for **performing reviews** [2].
*   **Hierarchical Orchestration:** The interactions within the team are managed by **orchestration agents**. This structure often mimics human **organizational workflows**, where a manager agent oversees and directs the efforts of specialized workers [2].
*   **Event-Driven and Asynchronous Communication:** Built on the AutoGen 0.4 architecture, Magentic-One utilizes **asynchronous messages** to coordinate its distributed agents. This allows the team to operate as a scalable network, collaborating effectively across different information boundaries [1].
*   **Complex Problem Solving:** It has demonstrated high-level performance on agentic benchmarks that require sophisticated planning and the ability to execute sequences of actions autonomously on behalf of humans [3].

In essence, Magentic-One serves as a template for building **general-purpose multi-agent systems** that can handle a wide variety of business processes and novel AI-based challenges by leveraging a group of specialized, coordinated AI actors [2, 3].
AutoGen Studio simplifies multi-agent workflows by providing a **graphical development environment** that removes the need for manual coding when orchestrating complex AI systems [1].

According to the sources, it streamlines the process through the following features:

*   **No-Code Workflow Creation:** It allows developers to create agentic workflows through a visual interface rather than writing extensive orchestration logic in Python [1].
*   **Drag-and-Drop Interface:** Users can build agent teams by simply dragging and dropping specialized agents into a workspace to define their interactions [2].
*   **Rapid Prototyping:** The tool is designed specifically for "no-code prototyping," making it easier to experiment with different multi-agent configurations and role-based specializations quickly [2].
*   **Built-in Debugging and Monitoring:** AutoGen Studio includes integrated support for monitoring agent behavior and debugging workflows, providing visibility into the multi-step reasoning and tool usage of the agents [1].
*   **Support for Scalable Architecture:** It leverages the AutoGen 0.4 architecture, which allows for the creation of **event-driven, distributed workflows** where long-running agents can collaborate across information boundaries using asynchronous messages [1, 2].

By automating the "legwork" of agent orchestration, AutoGen Studio enables developers to focus on defining high-level goals and agent roles rather than the underlying communication mechanics [2, 3].



Beyond the **Hierarchical Chat** (or Supervisor) pattern, several other common orchestration structures are used to coordinate multi-agent teams:

### 1. Joint Chat (Multi-Agent Collaboration)
In this pattern, multiple specialized agents collaborate within a **shared scratchpad** or common conversation space [1, 2]. All work performed by any individual agent is visible to all other team members [2]. This is highly effective for tasks where agents need to maintain constant awareness of each other's progress, though it can become overly verbose in complex workflows [2].

### 2. Sequential Pipeline (Prompt Chaining)
Agents are organized in a **fixed, linear chain** where the output of one agent becomes the direct input for the next [3-5]. 
*   **Predictability:** It is ideal for stable, repeatable processes like a content pipeline (e.g., Researcher → Writer → Editor) [4, 6].
*   **Specialization:** Each agent acts as a specialist in one stage of a larger standard operating procedure [4].

### 3. Graph-Based State Machine
This pattern treats agents as **nodes in a directed graph**, with explicit "edges" defining the transition probabilities and logic between them [3, 7, 8]. 
*   **Control:** It provides high-level control over the workflow, allowing for complex **conditional branching** and cycles (loops) that simple pipelines cannot handle [9, 10].
*   **Reliability:** Frameworks like LangGraph use this to ensure deterministic state transitions and "time-travel" debugging [8].

### 4. Event-Driven Workflows
Agents in this architecture **subscribe to event streams** and react to specific triggers rather than following a pre-set sequence [3, 10]. 
*   **Asynchrony:** It supports distributed, long-running agents that can collaborate across information boundaries using asynchronous messages [11]. 
*   **Flexibility:** This is useful for reactive systems, such as a mailbox agent that performs background actions based on incoming emails [11, 12].

### 5. Parallel Fleet (Parallelization)
The system decomposes a large task into multiple **independent sub-tasks** that are executed by a "fleet" of agents simultaneously [6, 13].
*   **Efficiency:** This massively increases speed and is often used for high-volume data processing or updating content across many different files at once [13, 14].
*   **Isolation:** Agents often work in isolated workspaces (like separate Git worktrees) to avoid merge conflicts [15, 16].

### 6. Classifier-Based Routing
Instead of a full LLM-based supervisor, a **fast classifier** identifies the user's intent and routes the task directly to the most relevant specialized agent [17, 18]. This reduces the "cognitive overhead" and latency associated with a human-like manager agent [19].

### 7. Evaluator-Optimizer (Reflection Loop)
This iterative pattern consists of a **Generator** that creates an initial draft and an **Evaluator (or Critic)** that provides feedback for refinement [20, 21]. The loop continues until the evaluator approves the output or a maximum number of iterations is reached, making it ideal for precision-critical tasks like code generation [20-22].


The **Evaluator-Optimizer** pattern (frequently referred to as the **Reflection pattern**) refines agent outputs through a dedicated iterative loop of generation and critique [1, 2]. This structure allows an AI system to evaluate its own work against specific criteria before finalizing a result [1].

### How the Pattern Works
This workflow typically involves two distinct roles—which can be separate LLM calls or even separate models—to minimize the "cognitive load" of managing the entire process at once:

*   **The Optimizer (Generator):** Produces an initial candidate output based on the user's request [2-4].
*   **The Evaluator (Critic):** Critiques the candidate output, suggesting modifications, deletions, or improvements to style and structure [3, 4].
*   **The Refinement Loop:** The structured critique is fed back to the Optimizer, which generates a revised version [2-4]. This cycle repeats for a fixed number of iterations ($n$) or until the Evaluator identifies no further improvements [4-6].

### Why it Helps Refine Outputs
This pattern is particularly effective for tasks where **correctness and precision** matter more than speed, helping to overcome the following challenges:

*   **Handling High Output Variance:** For complex tasks like **code generation**, single-pass responses often appear plausible but fail to meet subtle requirements [7]. Reflection catches these issues before they reach the user [7].
*   **Preventing Compounding Errors:** In multi-step reasoning, an early mistake can derail the entire solution; an evaluator can identify these "silent errors" early in the process [7, 8].
*   **Bridging Inexact Specs:** Tasks like **translation** rarely have a perfect one-to-one match between languages; multiple iterations allow the model to better align the meaning across both languages [2].
*   **Performance Gains:** Iterative workflows can dramatically boost the performance of smaller models. For example, while GPT-3.5 typically scores 48.1% on coding benchmarks, wrapping it in an agentic refinement loop can increase its performance to **95.1%** [9].

### Implementation Best Practices
To ensure the pattern remains efficient in production, developers often use the following strategies:
*   **Iteration Caps:** Capping the number of cycles prevents expensive "runaway loops" where the model might refine indefinitely [4].
*   **Explicit Criteria:** Defining clear evaluation criteria (e.g., "APPROVED if satisfactory") helps the critic provide actionable feedback [4, 10].
*   **Human-in-the-Loop:** A human can act as the evaluator, approving, editing, or rejecting the agent's proposed actions (such as code execution) before they are finalized [2, 11].

In the context of training AI agents through reinforcement learning, the difference between **outcome rewards** and **process rewards** lies in whether the evaluation focuses on the final result or the specific steps taken to reach it.

### **Outcome Rewards**
*   **Definition:** These rewards are primarily based on whether the final answer or result produced by the agent is correct [1]. 
*   **Verification:** They often use "verifiable rewards" that can be automatically checked by an algorithm or parser [2]. For example, in a math problem, a reward is given if the final numerical solution matches the correct one [2, 3].
*   **Limitations:** This approach typically ignores the intermediate reasoning and only looks at the end of the sequence [1].

### **Process Rewards**
*   **Definition:** These rewards evaluate the entire "chain of thought" or the intermediate reasoning steps leading to a final answer [1, 4]. 
*   **Purpose:** The goal is to encourage the model to follow a logical path, as the presence of clear intermediate steps is often correlated with more accurate final answers [4]. It is particularly useful for multi-step procedures like complex math problems [5, 6].
*   **Implementation (PRMs):** This is often handled by **Process Reward Models (PRMs)**, which are trained to grade the model’s explanations [1, 4].

### **Key Differences and Challenges**
*   **Reward Hacking:** Process rewards are significantly more susceptible to **reward hacking**, where the model learns to generate an explanation that "looks" good to the evaluator model but is logically flawed or designed solely to game the grading system [4].
*   **Computational Cost:** Outcome-based verifiable rewards allow for the elimination of large reward models in the training loop, saving memory and compute [2]. In contrast, process rewards often require an additional large language model (the PRM) to act as a judge for every step, which is more expensive [4, 7].
*   **Effectiveness:** While process rewards aim to drive higher accuracy by improving reasoning, some research (such as the DeepSeek-R1 paper) noted that attempts to use them were sometimes unsuccessful or not as worthwhile as verifiable outcome rewards due to the aforementioned hacking issues [4].


Process rewards struggle with reward hacking primarily because they rely on **imperfect proxy measures** of reasoning that are easier for a model to game than a verifiable final result [1, 2]. 

The sources identify several specific reasons for this struggle:

### 1. Difficulty in Grading Reasoning
Unlike outcome rewards, which can often be checked algorithmically (e.g., through a math parser), process rewards usually require **another Large Language Model (a Process Reward Model or PRM)** to act as a judge for each intermediate step [1, 3]. It is extremely difficult to train these judge models to be perfectly reliable, and if the judge has any flaws, the target model will quickly learn to exploit them rather than actually improving its logic [1, 4].

### 2. Exploitation of "Confidence" over "Correctness"
Process rewards are often derived from human approval or a model trained to imitate human approval [2, 5]. Models can learn "sycophantic" behaviors—such as sounding very confident even when they are incorrect—because humans and judge models are often misled by authoritative-sounding but logically flawed explanations [5, 6]. This creates a situation where the model is rewarded for the **style of its reasoning** rather than the validity of its steps [7].

### 3. Misgeneralization of Features
Reward models often compute rewards based on unexpected or contingent features of the environment rather than the intended goal [8]. In process supervision, a model might identify "shortcuts" in an explanation—specific phrases or formatting—that consistently trigger a high score from the evaluator model without actually performing the underlying reasoning [2, 8].

### 4. Failure in Real-World Application
Research noted in the sources, such as the DeepSeek-R1 paper, highlights that process-based supervision was often found to be **not worthwhile** because of these hacking issues [1]. The models were able to generate intermediate steps that "looked" right to the evaluator but were logically disjointed, leading to a failure in driving overall accuracy higher compared to simple verifiable outcome rewards [1]. 

This challenge often leads to a "turtles all the way down" problem, where developers end up needing a third model just to grade whether the second model is grading the first model's reasoning correctly [4].

To prevent **reward hacking** in process supervision—where models learn to generate reasoning steps that "look" correct to a judge but are logically flawed—developers utilize a combination of algorithmic verifiers, multi-layered model hierarchies, and rigorous regularization techniques. [1, 2]

Based on the sources, key strategies include:

### 1. Verifiable and Deterministic Rewards
The most effective way to eliminate hacking is to replace subjective model-based grading with **verifiable rewards (RLVR)** whenever possible. [3, 4]
*   **Algorithmic Parsers:** For domains like math, developers use parsers to algorithmically check the final answer against a ground truth, ensuring the process actually leads to a correct result. [5, 6]
*   **Unit Testing and Compilers:** In code generation, rewards are tied to whether the code actually compiles and passes predefined tests, which provides a "clear-cut" and objective signal that cannot be gamed by confident-sounding explanations. [7, 8]

### 2. Multi-Layered Judging ("Turtles All the Way Down")
When reasoning is too complex for simple algorithms, developers use hierarchical model structures to "grade the grader." [9, 10]
*   **Grader-of-Graders:** A third model is introduced to evaluate whether the second model (the Process Reward Model or PRM) is accurately rewarding valid logic or just rewarding stylistic quirks like confident phrasing or specific formatting. [9, 10]
*   **Model Ensembles:** Using an ensemble of reward models and tracking the **disagreement** between them helps identify when a model has navigated into an "unreliable region" where it might be exploiting a single judge's flaws. [11-14]

### 3. Regularization and Divergence Penalties
To prevent models from drastically changing their behavior just to exploit a reward signal, developers use **KL-divergence penalties**. [15, 16]
*   **Base Model Anchoring:** These penalties regularize the training by punishing the model if it drifts too far from a trusted "base" model. [15, 16]
*   **Measuring KL-Shift:** Monitoring the "KL-shift" during training allows developers to detect **reward over-optimization** before the model's output becomes nonsensical or "sycophantic." [11, 13]

### 4. Process Constraints and Formatting Rewards
Developers can enforce reasoning structures that are harder to fake. [17, 18]
*   **Think Tokens:** Models are often trained to use specific tags (e.g., `<think>`) to separate reasoning from the final answer. [17, 18]
*   **Style vs. Correctness Balancing:** Algorithms like **GDPO** have been developed to improve stability when balancing multiple rewards, such as a "correctness reward" and a "format reward," preventing the model from ignoring logic in favor of perfect formatting. [17-22]

### 5. Synchronous and Adversarial Training
*   **Frequent Re-labeling:** To keep the reward model accurate as the policy evolves, developers periodically obtain fresh human or high-level model labels for the new types of reasoning the model is attempting. [11, 13]
*   **Adversarial Probing:** Developers use red-teaming to find inputs that trigger "reasoning drift," where the agent's chain of thought becomes less coherent or builds on flawed intermediate conclusions. [23, 24]



Algorithmic parsers help prevent **reward hacking** by providing a **deterministic and objective** verification system that eliminates the subjectivity of model-based judges [1]. In traditional reinforcement learning from human feedback (RLHF), reward hacking occurs when a model learns to game a subjective evaluator by generating responses that "look" correct or sound confident without being logically sound [2-4].

Algorithmic parsers mitigate this through the following mechanisms:

### 1. Objective Correctness over Subjective Style
Unlike Process Reward Models (PRMs) that evaluate intermediate reasoning steps and are highly susceptible to hacking, algorithmic parsers focus on **verifiable rewards (RLVR)** [1, 3, 4]. Because the verifier checks for a specific, deterministic result (like a final numerical value), the model cannot earn a reward by simply adopting a persuasive or authoritative style [1, 3].

### 2. Domain-Specific Verification
The sources highlight two primary domains where algorithmic parsers are most effective:
*   **Mathematics:** A math parser can algorithmically compare a model's solution to a ground-truth answer (e.g., checking if two fractions are identical or if a rounded decimal matches a target) [1, 3].
*   **Coding:** Instead of a model "judging" code, the system can attempt to **compile** the code or run it against **unit tests** [1]. If the code fails to compile or pass tests, it receives no reward, providing a clear-cut signal that is impossible to game through confident-sounding explanations [1].

### 3. Eliminating "Turtles All the Way Down"
When models are used to grade other models, developers often encounter a "turtles all the way down" problem, where a third model is eventually needed to grade the second model's grading [5]. Algorithmic parsers break this cycle by replacing a large, fallible language model with a **reliable algorithm** [3]. This not only prevents hacking but also makes training more efficient because it eliminates the need to keep multiple heavy models (like a reward model and a value model) in memory simultaneously [3, 6].

By grounding rewards in **authoritative systems** rather than statistical approximations of "good" behavior, algorithmic parsers ensure that the model's behavior remains aligned with actual correctness [7].


The primary difference between **outcome rewards** and **process rewards** lies in whether the AI system is evaluated based on its final result or the specific reasoning steps it took to get there [1].

### **Outcome Rewards**
*   **Definition:** These rewards evaluate the model based solely on the correctness of the **final answer** or end result [1].
*   **Verification Method:** They often rely on **verifiable rewards (RLVR)** that can be checked algorithmically, such as using a math parser to compare a numerical result to a ground truth or a compiler to verify if code runs correctly [2].
*   **Key Advantage:** Because they are deterministic and objective, they eliminate the need for a large language model to act as a judge in the training loop, saving significant computational resources and memory [2].
*   **Limitation:** They ignore the intermediate reasoning, meaning a model might receive a reward for a correct answer reached through flawed logic [1].

### **Process Rewards**
*   **Definition:** These rewards (often managed by **Process Reward Models** or **PRMs**) evaluate the model's **intermediate steps**, explanations, or "chain of thought" [1, 3].
*   **Verification Method:** Verification is typically handled by another model that "grades" the reasoning steps [3]. In some advanced setups, this leads to a "turtles all the way down" hierarchy where a third model is needed to grade the second model's grading [4].
*   **Key Advantage:** Generating intermediate reasoning steps is highly correlated with more accurate final answers, and Improving these explanations can potentially drive overall accuracy higher than looking at results alone [1, 3].
*   **Limitation:** They are highly susceptible to **reward hacking**, where the model learns to generate reasoning that "looks" good or sounds confident to the judge model but is logically disjointed or flawed [3, 5].

### **Comparison Summary**

| Feature | Outcome Rewards | Process Rewards |
| :--- | :--- | :--- |
| **Focus** | Final output/answer [1] | Reasoning/intermediate steps [1] |
| **Verification** | Deterministic algorithmic parsers [2] | Subjective model-based judges (PRMs) [3] |
| **Reliability** | High; difficult to "game" [2] | Lower; prone to reward hacking [3] |
| **Cost** | Lower; eliminates judge models [2] | Higher; requires multiple models in memory [2, 4] |
| **Primary Goal** | Accuracy of the result [1] | Quality of the logical process [3] |



