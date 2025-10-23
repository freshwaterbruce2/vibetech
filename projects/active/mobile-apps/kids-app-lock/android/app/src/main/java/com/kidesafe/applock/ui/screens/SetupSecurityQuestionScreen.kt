package com.kidesafe.applock.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SetupSecurityQuestionScreen(
    onQuestionSet: (String, String) -> Unit,
    onBack: () -> Unit
) {
    var question by remember { mutableStateOf("What was the name of your first pet?") }
    var answer by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Security Question") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Set a security question",
                style = MaterialTheme.typography.headlineSmall,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "This will help you recover your PIN if you forget it",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))

            OutlinedTextField(
                value = question,
                onValueChange = {
                    question = it
                    errorMessage = null
                },
                label = { Text("Security Question") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = answer,
                onValueChange = {
                    answer = it
                    errorMessage = null
                },
                label = { Text("Your Answer") },
                modifier = Modifier.fillMaxWidth(),
                isError = errorMessage != null
            )

            if (errorMessage != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = {
                    when {
                        question.isBlank() -> {
                            errorMessage = "Please enter a security question"
                        }
                        answer.isBlank() -> {
                            errorMessage = "Please enter an answer"
                        }
                        else -> {
                            onQuestionSet(question, answer)
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = question.isNotBlank() && answer.isNotBlank()
            ) {
                Text("Continue")
            }
        }
    }
}
